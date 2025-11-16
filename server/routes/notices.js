const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// [GET] /api/notices - 공지사항 목록 조회
router.get('/', async (req, res) => {
    try {
        const sql = 'SELECT id, title, content, created_at FROM Announcements ORDER BY created_at DESC';
        const notices = await db.executeQuery(sql);
        
        // 클라이언트의 api_client.py 형식을 맞추기 위해 "ok: true"와 "items"로 응답
        return res.status(200).json({
            ok: true,
            items: notices
        });
    } catch (error) {
        console.error("공지사항 조회 중 서버 오류:", error.message);
        return res.status(500).json({ ok: false, error: '서버 오류 발생' });
    }
});

// [POST] /api/notices - 공지사항 작성
router.post('/', async (req, res) => {
    // 사장님 인증 로직이 없으므로, user_id만 확인
    const { authorId, title, content } = req.body;
    const now = new Date();

    // 💡 Socket.IO 객체와 연결된 클라이언트 목록을 Express 앱에서 가져옵니다.
    const io = req.app.get('socketio');
    const connectedClients = req.app.get('connectedClients'); // (server.js에 추가 예정)

    // TODO: 1. 실제로 authorId의 role이 'manager'인지 확인하는 로직 필요

    try {
        // 2. DB에 공지 저장
        const sql = 'INSERT INTO Announcements (author_id, title, content, created_at) VALUES (?, ?, ?, ?)';
        const result = await db.executeQuery(sql, [authorId, title, content, now]);

        // 3. Socket.IO를 사용해 모든 알바생에게 실시간 알림 전송
        const message = JSON.stringify({
            event: 'new_notice',
            title: title,
            content: content
        });
        
        // io.emit() 대신 broadcast를 사용하여 모든 클라이언트에게 메시지 전송
        // 이 메시지는 ws_client.py에서 파싱되어 '공지 도착' 알림을 띄울 것입니다.
        io.emit('noticeBroadcast', message); 

        return res.status(201).json({ 
            ok: true, 
            message: '공지사항 등록 성공', 
            id: result.insertId 
        });

    } catch (error) {
        console.error("공지사항 등록 중 서버 오류:", error.message);
        return res.status(500).json({ ok: false, error: '서버 오류 발생' });
    }
});

module.exports = router;