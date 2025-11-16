const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// POST /api/v1/attendance/check_in (출근)
router.post('/check_in', async (req, res) => {
    // TODO: 사용자 인증 (토큰 검증) 로직이 필요합니다.
    const { userId } = req.body;
    const now = new Date();

    // 1. DB에 출근 기록 저장
    try {
        const sql = 'INSERT INTO Attendance (user_id, check_in_time) VALUES (?, ?)';
        await db.executeQuery(sql, [userId, now]);

        // 2. 실시간 알림 로직 (사장님에게 푸시)
        const io = req.app.get('socketio');
        const connectedClients = req.app.get('connectedClients');
        
        // 가정: 사장님 ID가 1번이라고 가정하고 해당 소켓에 메시지 전송
        const managerId = 1;
        const managerSocket = connectedClients[managerId];
        
        if (managerSocket) {
            io.to(managerSocket.id).emit('checkInAlert', { userId, time: now, message: `${userId}님이 출근했습니다.` });
        }

        return res.status(200).json({ message: '출근 기록 성공', time: now });

    } catch (error) {
        return res.status(500).json({ message: '출근 기록 중 서버 오류', error: error.message });
    }
});

// POST /api/v1/attendance/check_out (퇴근)
router.post('/check_out', async (req, res) => {
    // TODO: 퇴근 로직 구현 (가장 최근 출근 기록에 퇴근 시간 업데이트)
    const { userId } = req.body;
    const now = new Date();
    
    // 예시: 가장 최근 출근 기록을 찾고 업데이트
    // UPDATE Attendance SET check_out_time = ? WHERE user_id = ? AND check_out_time IS NULL ORDER BY check_in_time DESC LIMIT 1
    
    return res.status(200).json({ message: '퇴근 기록 성공', time: now });
});

module.exports = router;