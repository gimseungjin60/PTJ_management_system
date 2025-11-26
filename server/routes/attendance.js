const express = require('express');
const router = express.Router();
const db = require('../db/connection');


// [POST] /api/attendance/check_in (출근) - 트랜잭션 + 지각 판단 포함
router.post('/check_in', async (req, res) => {
    const { userId } = req.body;
    const now = new Date();

    console.log(`--- [출근] 요청 수신 --- ID: ${userId}`);

    if (!userId) {
        return res.status(400).json({ message: '사용자 ID가 필요합니다.' });
    }

    let connection;
    try {
        connection = await db.pool.getConnection();
        await connection.beginTransaction();

        // 1. 이미 출근 중인지 확인
        const checkSql = `
            SELECT id FROM attendance
            WHERE user_id = ? AND check_out_time IS NULL
            FOR UPDATE
        `;
        const [activeRecord] = await connection.execute(checkSql, [userId]);

        if (activeRecord.length > 0) {
            await connection.rollback();
            console.log(`출근 실패: 이미 출근 중 (ID: ${userId})`);
            return res.status(400).json({ message: '이미 출근 상태입니다. 퇴근 처리를 먼저 해주세요.' });
        }

        // 2. 🔥 users 테이블에서 출근 기준(work_start_time) 조회
        const timeSql = `
            SELECT work_start_time 
            FROM users
            WHERE id = ?
            FOR UPDATE
        `;
        const [userRows] = await connection.execute(timeSql, [userId]);

        if (userRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const workStartTime = userRows[0].work_start_time; // '09:00:00'

        // 3. 🔥 지각 판정
        let isLate = 0;

        if (workStartTime) {
            const today = now.toISOString().split("T")[0];
            const standardTime = new Date(`${today}T${workStartTime}`);

            if (now > standardTime) {
                isLate = 1;
            }
        }
        router.get('/today', async (req, res) => {
        try {
            const sql = `
                SELECT 
                    a.id,
                    a.user_id,
                    u.name,
                    u.work_start_time,
                    a.check_in_time,
                    a.check_out_time,
                    a.is_late
                FROM attendance a
                JOIN users u ON a.user_id = u.id
                WHERE DATE(a.check_in_time) = CURDATE()
                ORDER BY a.check_in_time ASC
            `;
            
            const rows = await db.executeQuery(sql);

            return res.status(200).json(rows);
        } catch (error) {
            console.error("실시간 현황 오류:", error);
            return res.status(500).json({ message: "서버 오류" });
        }
    });

        // 4. 🔥 출근 기록 저장
        const insertSql = `
            INSERT INTO attendance (user_id, check_in_time, is_late)
            VALUES (?, ?, ?)
        `;
        await connection.execute(insertSql, [userId, now, isLate]);

        await connection.commit();

        // 5. 소켓 알림
        const io = req.app.get('socketio');
        if (io) {
            io.emit('checkInAlert', { 
                userId, 
                time: now.toISOString(),
                isLate,
                message: `직원 ${userId}님이 ${isLate ? '지각하여' : ''} 출근했습니다.` 
            });
        }

        console.log(`[출근] 기록 완료: ${now.toLocaleString()} (ID: ${userId}, 지각:${isLate})`);

        return res.status(200).json({ 
            message: isLate ? '지각 출근입니다.' : '출근 기록 성공',
            time: now,
            isLate
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("출근 오류:", error);
        return res.status(500).json({ message: '서버 오류', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});


// [POST] /api/attendance/check_out (퇴근)
router.post('/check_out', async (req, res) => {
    const { userId } = req.body;
    const now = new Date();

    console.log(`--- [퇴근] 요청 수신 --- ID: ${userId}`);

    if (!userId) {
        return res.status(400).json({ message: '사용자 ID가 필요합니다.' });
    }

    let connection;
    try {
        connection = await db.pool.getConnection();
        await connection.beginTransaction();

        const findSql = `
            SELECT id FROM attendance
            WHERE user_id = ? AND check_out_time IS NULL
            ORDER BY check_in_time DESC
            LIMIT 1
            FOR UPDATE
        `;
        const [records] = await connection.execute(findSql, [userId]);

        if (records.length === 0) {
            await connection.rollback();
            console.log(`퇴근 실패: 출근 기록 없음 (ID: ${userId})`);
            return res.status(400).json({ message: '현재 출근 상태가 아닙니다.' });
        }

        const recordId = records[0].id;

        const updateSql = `
            UPDATE attendance
            SET check_out_time = ?
            WHERE id = ?
        `;
        await connection.execute(updateSql, [now, recordId]);

        await connection.commit();

        const io = req.app.get('socketio');
        if (io) {
            io.emit('checkOutAlert', { 
                userId, 
                time: now.toISOString(), 
                message: `직원 ${userId}님이 퇴근했습니다.` 
            });
        }

        console.log(`[퇴근] 기록 완료: ${now.toLocaleString()} (ID: ${userId})`);
        return res.status(200).json({ message: '퇴근 기록 성공', time: now });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("퇴근 오류:", error);
        return res.status(500).json({ message: '서버 오류', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});


module.exports = router;
