const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// 1. [GET] /api/manager/dashboard - 사장님 대시보드 데이터 조회
router.get('/dashboard', async (req, res) => {
    try {
        // 1. 오늘 날짜 구하기 (로컬 시간 기준 YYYY-MM-DD)
        // toISOString()은 UTC 기준이라 한국 시간과 다를 수 있음.
        // 로컬 시간대 기준으로 날짜 문자열 생성
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayDate = `${year}-${month}-${day}`; 

        console.log(`--- 대시보드 조회 요청 (날짜: ${todayDate}) ---`);

        // 2. 전체 직원(worker) 목록 가져오기
        // Users 테이블의 id(PK)와 user_id(문자열 ID) 모두 가져옴
        const usersSql = "SELECT id, user_id, name FROM Users WHERE role = 'worker'";
        const workers = await db.executeQuery(usersSql);

        // 3. 오늘의 출퇴근 기록 가져오기
        // DATE() 함수를 사용하여 날짜 부분만 비교
        const attendanceSql = `
            SELECT user_id, check_in_time, check_out_time 
            FROM Attendance 
            WHERE DATE(check_in_time) = ?
        `;
        const todayRecords = await db.executeQuery(attendanceSql, [todayDate]);

        console.log(`조회된 오늘 기록 수: ${todayRecords.length}`);

        // 4. 통계 및 리스트 가공
        let workingCount = 0;
        let checkInCount = 0;
        
        // 직원별 상태 매핑
        const statusList = workers.map(worker => {
            // 해당 직원의 오늘 기록 찾기
            // Attendance 테이블의 user_id는 Users 테이블의 id(숫자 PK)를 참조한다고 가정
            // 만약 Attendance에 문자열 ID가 들어간다면 r.user_id === worker.user_id 로 변경해야 함
            const record = todayRecords.find(r => r.user_id === worker.id);
            
            let status = '미출근';
            let timeText = '';
            let isLate = false;

            if (record) {
                checkInCount++;
                const checkInTime = new Date(record.check_in_time);
                // 시간 포맷팅 (HH:MM)
                const hours = checkInTime.getHours().toString().padStart(2, '0');
                const minutes = checkInTime.getMinutes().toString().padStart(2, '0');
                timeText = `${hours}:${minutes}`;

                // 지각 체크 (예: 9시 1분부터 지각)
                if (checkInTime.getHours() >= 9 && checkInTime.getMinutes() > 0) {
                    isLate = true;
                }

                if (record.check_out_time) {
                    status = '퇴근';
                } else {
                    status = '근무 중';
                    workingCount++;
                }
            }

            return {
                id: worker.id, // 리스트 키용 ID
                name: worker.name,
                status: status,
                time: timeText, 
                isLate: isLate
            };
        });

        // 5. 응답 데이터 구성
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

// 5. [GET] /api/manager/attendance - 전체 출퇴근 기록 조회
router.get('/attendance', async (req, res) => {
    try {
        const sql = `
            SELECT 
                a.id, 
                u.name, 
                a.check_in_time, 
                a.check_out_time
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