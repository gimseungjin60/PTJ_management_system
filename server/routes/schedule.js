// routes/schedule.js
const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// [POST] /api/schedule - 기간 일괄 등록 (반복문 사용)
router.post('/', async (req, res) => {
    // startDate, endDate를 받습니다.
    const { userId, startDate, endDate, startTime, endTime } = req.body;

    if (!userId || !startDate || !endDate || !startTime || !endTime) {
        return res.status(400).json({ message: '모든 정보를 입력해주세요.' });
    }

    try {
        const start = new Date(startDate);
        const end = new Date(endDate);

        // 날짜 차이 계산 (시작일 ~ 종료일)
        // 반복문을 돌면서 하루씩 증가시킵니다.
        let currentDate = start;
        
        while (currentDate <= end) {
            // YYYY-MM-DD 형식으로 변환
            const dateStr = currentDate.toISOString().split('T')[0];

            const sql = `
                INSERT INTO schedule (user_id, schedule_date, start_time, end_time)
                VALUES (?, ?, ?, ?)
            `;
            // 에러가 나더라도 일단 계속 진행하거나, 여기서 멈출 수 있습니다.
            // 간단하게 구현하기 위해 await로 하나씩 넣습니다.
            await db.executeQuery(sql, [userId, dateStr, startTime, endTime]);

            // 하루 더하기
            currentDate.setDate(currentDate.getDate() + 1);
        }

        res.status(201).json({ message: '기간 일괄 등록이 완료되었습니다.' });

    } catch (error) {
        console.error("일정 등록 오류:", error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// [GET] /api/schedule/date/:date - 특정 날짜의 모든 직원 일정 조회 (사장님용)
router.get('/date/:date', async (req, res) => {
    const { date } = req.params;
    try {
        const sql = `
            SELECT s.id, u.name, 
                   TIME_FORMAT(s.start_time, '%H:%i') as startTime, 
                   TIME_FORMAT(s.end_time, '%H:%i') as endTime
            FROM schedule s
            JOIN users u ON s.user_id = u.id
            WHERE s.schedule_date = ?
        `;
        const schedules = await db.executeQuery(sql, [date]);
        res.status(200).json(schedules);
    } catch (error) {
        console.error("날짜별 일정 조회 오류:", error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// [GET] /api/schedule/my-schedule?year=2025&month=11
// 특정 달의 근무 일정 조회
router.get('/my-schedule', async (req, res) => {
    const { userId, year, month } = req.query;

    if (!userId || !year || !month) {
        return res.status(400).json({ message: '필수 정보가 누락되었습니다.' });
    }

    try {
        // schedule 테이블에서 해당 월의 데이터 조회
        const sql = `
            SELECT 
                DATE_FORMAT(schedule_date, '%Y-%m-%d') as date,
                TIME_FORMAT(start_time, '%H:%i') as startTime,
                TIME_FORMAT(end_time, '%H:%i') as endTime
            FROM schedule
            WHERE user_id = ? 
            AND MONTH(schedule_date) = ? 
            AND YEAR(schedule_date) = ?
        `;
        const schedules = await db.executeQuery(sql, [userId, month, year]);
        
        res.status(200).json(schedules);
    } catch (error) {
        console.error("일정 조회 오류:", error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// [GET] /api/schedule/my-salary?year=2025&month=11
// 이번 달 예상 급여 조회 (실제 근무 기록 기반)
router.get('/my-salary', async (req, res) => {
    const { userId, year, month } = req.query;

    try {
        // 1. 시급 가져오기
        const userSql = "SELECT hourly_wage FROM users WHERE id = ?";
        const [user] = await db.executeQuery(userSql, [userId]);
        
        if (!user) return res.status(404).json({ message: '사용자 없음' });

        const hourlyWage = user.hourly_wage;

        // 2. 이번 달 근무 기록 가져오기 (attendance 테이블)
        const attendSql = `
            SELECT check_in_time, check_out_time 
            FROM attendance 
            WHERE user_id = ? 
            AND MONTH(check_in_time) = ? 
            AND YEAR(check_in_time) = ?
            AND check_out_time IS NOT NULL
        `;
        const records = await db.executeQuery(attendSql, [userId, month, year]);

        // 3. 총 근무 시간 계산 (밀리초 -> 시간)
        let totalHours = 0;
        records.forEach(record => {
            const start = new Date(record.check_in_time);
            const end = new Date(record.check_out_time);
            const diff = (end - start) / (1000 * 60 * 60); // 시간 단위 변환
            totalHours += diff;
        });

        // 4. 급여 계산 (소수점 버림)
        const estimatedSalary = Math.floor(totalHours * hourlyWage);

        res.status(200).json({
            year,
            month,
            totalHours: totalHours.toFixed(1), // 소수점 1자리까지
            hourlyWage,
            estimatedSalary
        });

    } catch (error) {
        console.error("급여 조회 오류:", error);
        res.status(500).json({ message: '서버 오류' });
    }
});

module.exports = router;