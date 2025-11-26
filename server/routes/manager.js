const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// [GET] /api/manager/dashboard - 사장님 대시보드 데이터 조회
router.get('/dashboard', async (req, res) => {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayDate = `${year}-${month}-${day}`;

        console.log(`--- 대시보드 조회 요청 (날짜: ${todayDate}) ---`);

        // 🔥 work_start_time 추가!
        const usersSql = "SELECT id, user_id, name, work_start_time FROM Users WHERE role = 'worker'";
        const workers = await db.executeQuery(usersSql);

        const attendanceSql = `
            SELECT user_id, check_in_time, check_out_time, is_late
            FROM Attendance
            WHERE DATE(check_in_time) = ?
        `;
        const todayRecords = await db.executeQuery(attendanceSql, [todayDate]);

        let workingCount = 0;
        let checkInCount = 0;

        const statusList = workers.map(worker => {
            const record = todayRecords.find(r => r.user_id === worker.id);

            let status = '미출근';
            let timeText = '';
            let isLate = false;

            if (record) {
                checkInCount++;

                const checkInTime = new Date(record.check_in_time);
                const hours = checkInTime.getHours().toString().padStart(2, '0');
                const minutes = checkInTime.getMinutes().toString().padStart(2, '0');
                timeText = `${hours}:${minutes}`;

                if (record.check_out_time) {
                    status = '퇴근';
                } else {
                    status = '근무 중';
                    workingCount++;
                }

                isLate = record.is_late === 1;
            }

            return {
                id: worker.id,
                name: worker.name,
                status: status,
                time: timeText,
                isLate: isLate,
                workStartTime: worker.work_start_time || null // ★ 여기가 핵심!
            };
        });

        const responseData = {
            stats: {
                todayCheckIn: checkInCount,
                working: workingCount,
                late: statusList.filter(s => s.isLate).length,
                totalWorkers: workers.length
            },
            statusList: statusList
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error("대시보드 조회 오류:", error);
        res.status(500).json({ message: '서버 오류 발생' });
    }
});

// 2. [GET] /api/manager/employees - 직원 목록 조회
router.get('/employees', async (req, res) => {
    try {
        const sql = "SELECT id, user_id, name, hourly_wage, created_at FROM Users WHERE role = 'worker' ORDER BY created_at DESC";
        const employees = await db.executeQuery(sql);
        res.status(200).json(employees);
    } catch (error) {
        console.error("직원 목록 조회 오류:", error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 3. [POST] /api/manager/employees - 직원 추가
router.post('/employees', async (req, res) => {
    const { userId, password, name, hourlyWage } = req.body;

    if (!userId || !password || !name) {
        return res.status(400).json({ message: '모든 정보를 입력해주세요.' });
    }

    try {
        const checkSql = "SELECT id FROM Users WHERE user_id = ?";
        const existing = await db.executeQuery(checkSql, [userId]);
        if (existing.length > 0) {
            return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });
        }

        const sql = `
            INSERT INTO Users (user_id, password, name, role, hourly_wage) 
            VALUES (?, ?, ?, 'worker', ?)
        `;
        await db.executeQuery(sql, [userId, password, name, hourlyWage || 9860]);

        res.status(201).json({ message: '직원이 등록되었습니다.' });
    } catch (error) {
        console.error("직원 등록 오류:", error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 4. [DELETE] /api/manager/employees/:id - 직원 삭제
router.delete('/employees/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.executeQuery("DELETE FROM Attendance WHERE user_id = ?", [id]);
        const sql = "DELETE FROM Users WHERE id = ?";
        await db.executeQuery(sql, [id]);
        
        res.status(200).json({ message: '직원이 삭제되었습니다.' });
    } catch (error) {
        console.error("직원 삭제 오류:", error);
        res.status(500).json({ message: '삭제 중 오류가 발생했습니다.' });
    }
});
    // 직원 기준 출근시간 설정
router.put('/set-work-time', async (req, res) => {
    const { userId, workStartTime } = req.body;

    console.log("기준 출근시간 업데이트 요청:", userId, workStartTime);

    if (!userId || !workStartTime) {
        return res.status(400).json({ message: 'userId와 workStartTime이 필요합니다.' });
    }

    try {
        const sql = `
            UPDATE Users
            SET work_start_time = ?
            WHERE id = ?
        `;
        await db.executeQuery(sql, [workStartTime, userId]);

        return res.status(200).json({ 
            message: '기준 출근시간 업데이트 완료',
            userId,
            workStartTime
        });

    } catch (error) {
        console.error("기준 출근시간 업데이트 오류:", error);
        return res.status(500).json({ message: '서버 오류 발생' });
    }
});

// 5. [GET] /api/manager/attendance - 전체 출퇴근 기록 조회
router.get('/attendance', async (req, res) => {
    try {
        const sql = `
            SELECT 
                a.id, 
                u.name, 
                a.check_in_time, 
                a.check_out_time,
                u.work_start_time
            FROM Attendance a
            JOIN Users u ON a.user_id = u.id
            ORDER BY a.check_in_time DESC
        `;
        const records = await db.executeQuery(sql);

        const formattedRecords = records.map(record => {
            const checkIn = new Date(record.check_in_time);
            const checkOut = record.check_out_time ? new Date(record.check_out_time) : null;
            
            let hoursText = '-';
            if (checkOut) {
                const diffMs = checkOut - checkIn;
                const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                hoursText = `${diffHrs}시간 ${diffMins}분`;
            }

            return {
                id: record.id,
                name: record.name,
                date: checkIn.toLocaleDateString('ko-KR'),
                in: checkIn.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
                out: checkOut ? checkOut.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '근무 중',
                hours: hoursText
            };
        });

        res.status(200).json(formattedRecords);
    } catch (error) {
        console.error("출퇴근 기록 조회 오류:", error);
        res.status(500).json({ message: '서버 오류' });
    }
});

module.exports = router;