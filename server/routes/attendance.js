const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// [POST] /api/attendance/check_in (출근) - 트랜잭션 적용
router.post('/check_in', async (req, res) => {
    // 🛠️ [수정됨] 이제 클라이언트가 보내준 진짜 userId를 사용합니다!
    // (만약 클라이언트가 안 보내면 에러를 냅니다)
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

        // 1. [Lock] 해당 유저의 '퇴근 안 한 기록'이 있는지 확인 (동시성 제어)
        const checkSql = `
            SELECT id FROM Attendance 
            WHERE user_id = ? AND check_out_time IS NULL 
            FOR UPDATE
        `;
        const [activeRecord] = await connection.execute(checkSql, [userId]);

        if (activeRecord.length > 0) {
            await connection.rollback();
            console.log(`출근 실패: 이미 출근 중 (ID: ${userId})`);
            return res.status(400).json({ message: '이미 출근 상태입니다. 퇴근 처리를 먼저 해주세요.' });
        }

        // 2. 출근 기록 저장
        const insertSql = 'INSERT INTO Attendance (user_id, check_in_time) VALUES (?, ?)';
        await connection.execute(insertSql, [userId, now]);

        await connection.commit();

        // 3. 소켓 알림
        const io = req.app.get('socketio');
        if (io) {
            io.emit('checkInAlert', { 
                userId, 
                time: now.toISOString(), 
                message: `직원 ${userId}님이 출근했습니다.` 
            });
        }

        console.log(`[출근] DB 저장 완료: ${now.toLocaleString()} (ID: ${userId})`);
        return res.status(200).json({ message: '출근 기록 성공', time: now });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("출근 오류:", error);
        return res.status(500).json({ message: '서버 오류', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// [POST] /api/attendance/check_out (퇴근) - 트랜잭션 적용
router.post('/check_out', async (req, res) => {
    const { userId } = req.body; // 🛠️ 진짜 ID 사용
    const now = new Date();

    console.log(`--- [퇴근] 요청 수신 --- ID: ${userId}`);

    if (!userId) {
        return res.status(400).json({ message: '사용자 ID가 필요합니다.' });
    }

    let connection;
    try {
        connection = await db.pool.getConnection();
        await connection.beginTransaction();

        // 1. [Lock] 퇴근하지 않은 가장 최근 기록 찾기
        const findSql = `
            SELECT id FROM Attendance 
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

        // 2. 퇴근 시간 업데이트
        const updateSql = 'UPDATE Attendance SET check_out_time = ? WHERE id = ?';
        await connection.execute(updateSql, [now, recordId]);

        await connection.commit();

        // 3. 소켓 알림
        const io = req.app.get('socketio');
        if (io) {
            io.emit('checkOutAlert', { 
                userId, 
                time: now.toISOString(), 
                message: `직원 ${userId}님이 퇴근했습니다.` 
            });
        }

        console.log(`[퇴근] DB 업데이트 완료: ${now.toLocaleString()} (ID: ${userId})`);
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