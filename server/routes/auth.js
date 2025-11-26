const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const jwt = require('jsonwebtoken');

// ! JWT 비밀 키 (실무에서는 .env 사용)
const JWT_SECRET = 'YOUR_SUPER_SECRET_KEY'; 

// [POST] /api/auth/login
router.post('/login', async (req, res) => {
    console.log("--- 로그인 요청 도착 ---");
    console.log("BODY:", req.body); // 👈 이 로그를 추가해서 확인해보세요!
    const { userId, password } = req.body; // 클라이언트는 userId로 보냄

    console.log(`--- 로그인 요청 수신: ${userId} ---`);

    if (!userId || !password) {
        return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요.' });
    }
    
    try {
        // 1. 사용자 조회 (user_id 컬럼 기준)
        const sql = 'SELECT id, user_id, name, role, hourly_wage, password FROM users WHERE user_id = ?';
        const users = await db.executeQuery(sql, [userId]);
        
        if (users.length === 0) {
            return res.status(401).json({ message: '아이디를 찾을 수 없습니다.' });
        }
        
        const user = users[0];
        
        // 2. 비밀번호 비교
        if (user.password !== password) {
            return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
        }
        
        // 3. 토큰 생성
        const payload = { id: user.id, role: user.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        
        // 4. 성공 응답 (user.id가 핵심!)
        console.log(`✅ 로그인 성공: ${user.name} (${user.id})`);
        return res.status(200).json({
            message: '로그인 성공',
            token: token,
            user: {
                id: user.id,         // ★ 이 숫자 ID를 출퇴근에 써야 함
                userId: user.user_id,
                name: user.name,
                role: user.role,
                hourlyWage: user.hourly_wage 
            }
        });
        
    } catch (error) {
        console.error("로그인 오류:", error);
        return res.status(500).json({ message: '서버 오류 발생' });
    }
});

module.exports = router;