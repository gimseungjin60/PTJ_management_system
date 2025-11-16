const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// 💡 POST /api/v1/auth/login API 구현 예정
router.post('/login', async (req, res) => {
    console.log("--- 로그인 요청 수신 ---");
    // TODO: 여기에 DB에서 사용자 정보를 조회하는 로직을 넣습니다.
    const { user_id, password } = req.body;
    
    try {
        // 1. 사용자 조회 (username 기준)
        const sql = 'SELECT id, user_id, password, name, role, hourly_wage FROM Users WHERE user_id = ?';
        const users = await db.executeQuery(sql, [user_id]);
        console.log("사용자 조회 성공:", users.length > 0);
        if (users.length === 0) {
            // 사용자가 없는 경우
            return res.status(401).json({ ok: false, error: '아이디를 찾을 수 없습니다.' });
            }
        const user = users[0];
        // 2. 비밀번호 비교 (현재는 평문 비교)
        if (user.password !== password) {
            return res.status(401).json({ ok: false, error: '비밀번호가 일치하지 않습니다.' });
            }
        // 3. 로그인 성공 및 응답
        return res.status(200).json({
            ok: true,
            token: 'dummy-jwt-token', // TODO: 실제 JWT 토큰으로 교체 필요
            user: {
                user_id: user.id,
                name: user.name,
                role: user.role
                }
        });
    } catch (error) {
        console.error("로그인 중 서버 오류:", error.message);
        return res.status(500).json({ ok: false, error: '서버 오류 발생' });
    }
});

module.exports = router;
