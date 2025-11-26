// [POST] /api/users/update-worktime
router.post('/update-worktime', async (req, res) => {
    const { userId, workStartTime } = req.body;

    if (!userId || !workStartTime) {
        return res.status(400).json({ message: 'userId와 workStartTime이 필요합니다.' });
    }

    try {
        const sql = "UPDATE users SET work_start_time = ? WHERE id = ?";
        await db.executeQuery(sql, [workStartTime, userId]);

        return res.status(200).json({
            message: '출근 기준 시간이 설정되었습니다.',
            userId,
            workStartTime
        });

    } catch (error) {
        console.error("출근 기준시간 업데이트 오류:", error);
        return res.status(500).json({ message: '서버 오류', error: error.message });
    }
});
router.get('/all-workers', async (req, res) => {
    try {
        const sql = `
            SELECT 
                id, 
                user_id, 
                name, 
                role, 
                work_start_time 
            FROM users
            WHERE role = 'worker';
        `;
        const workers = await db.executeQuery(sql);

        return res.status(200).json({
            message: "알바생 목록 조회 성공",
            workers
        });

    } catch (error) {
        console.error("알바생 목록 조회 오류:", error);
        return res.status(500).json({ message: "서버 오류" });
    }
});

