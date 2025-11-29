const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// 1. [GET] /api/notices - 공지사항 목록 조회
router.get('/', async (req, res) => {
    try {
        // 최신순으로 정렬해서 가져오기 (작성자 이름도 함께 조회)
        const sql = `
            SELECT n.id, n.title, n.content, n.created_at, u.name as author_name
            FROM Announcements n
            JOIN Users u ON n.author_id = u.id
            ORDER BY n.created_at DESC
        `;
        const notices = await db.executeQuery(sql);
        res.status(200).json(notices);
    } catch (error) {
        console.error("공지 조회 오류:", error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 2. [POST] /api/notices - 공지사항 작성 (사장님만 가능)
router.post('/', async (req, res) => {
    const { authorId, title, content } = req.body;

    // TODO: 실제로는 JWT 토큰에서 role을 확인해야 함.
    // 지금은 authorId로 사장님인지 DB에서 한 번 더 확인
    
    try {
        // 작성자가 사장님인지 확인
        const managerCheck = await db.executeQuery("SELECT role FROM Users WHERE id = ?", [authorId]);
        if (managerCheck.length === 0 || managerCheck[0].role !== 'manager') {
            return res.status(403).json({ message: '사장님만 공지를 작성할 수 있습니다.' });
        }

        // DB에 저장
        const sql = 'INSERT INTO announcements (author_id, title, content) VALUES (?, ?, ?)';
        await db.executeQuery(sql, [authorId, title, content]);

        // 📢 [핵심] 모든 알바생에게 실시간 알림 발송 (Socket.IO)
        const io = req.app.get('socketio');
        if (io) {
            io.emit('noticeBroadcast', {
                title: title,
                content: content, // 내용은 너무 길면 잘라서 보낼 수도 있음
                createdAt: new Date().toISOString()
            });
            console.log("📢 전체 공지 알림 전송 완료");
        }


        res.status(201).json({ message: '공지사항이 등록되었습니다.' });

    } catch (error) {
        console.error("공지 등록 오류:", error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 3. [DELETE] /api/notices/:id - 공지사항 삭제
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // DB에서 삭제
        const sql = "DELETE FROM announcements WHERE id = ?";
        await db.executeQuery(sql, [id]);

        res.status(200).json({ message: '공지사항이 삭제되었습니다.' });
        console.log("📢 공지사항이 삭제되었습니다.");
    } catch (error) {
        console.error("공지 삭제 오류:", error);
        res.status(500).json({ message: '서버 오류' });
    }
});

module.exports = router;