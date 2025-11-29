const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// [POST] 일정 등록 (기간 일괄 등록)
router.post('/', async (req, res) => {
    const { userId, startDate, endDate, startTime, endTime } = req.body;

    if (!userId || !startDate || !endDate || !startTime || !endTime) {
        return res.status(400).json({ message: '모든 정보를 입력해주세요.' });
    }

    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let currentDate = start;
        
        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const sql = `
                INSERT INTO schedule (user_id, schedule_date, start_time, end_time)
                VALUES (?, ?, ?, ?)
            `;
            await db.executeQuery(sql, [userId, dateStr, startTime, endTime]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        res.status(201).json({ message: '일정이 등록되었습니다.' });

    } catch (error) {
        console.error("일정 등록 오류:", error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// [DELETE] 일정 삭제
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const sql = "DELETE FROM schedule WHERE id = ?";
        await db.executeQuery(sql, [id]);
        res.status(200).json({ message: '일정이 삭제되었습니다.' });
    } catch (error) {
        console.error("일정 삭제 오류:", error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// [GET] 날짜별 상세 일정 조회 (문자열 비교로 정확도 UP)
router.get('/date/:date', async (req, res) => {
    const { date } = req.params;
    try {
        const sql = `
            SELECT s.id, u.name, 
                   TIME_FORMAT(s.start_time, '%H:%i') as startTime, 
                   TIME_FORMAT(s.end_time, '%H:%i') as endTime
            FROM schedule s
            JOIN users u ON s.user_id = u.id
            WHERE DATE_FORMAT(s.schedule_date, '%Y-%m-%d') = ? 
        `;
        const schedules = await db.executeQuery(sql, [date]);
        res.status(200).json(schedules);
    } catch (error) {
        console.error("상세 일정 조회 오류:", error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// [GET] 월별 근무 인원 수 요약 (캘린더 표시용)
router.get('/summary', async (req, res) => {
    const { year, month } = req.query;
    try {
        const sql = `
            SELECT DATE_FORMAT(schedule_date, '%Y-%m-%d') as dateStr, COUNT(*) as count
            FROM schedule
            WHERE MONTH(schedule_date) = ? AND YEAR(schedule_date) = ?
            GROUP BY schedule_date
        `;
        const rows = await db.executeQuery(sql, [month, year]);
        res.status(200).json(rows);
    } catch (error) {
        console.error("일정 요약 조회 오류:", error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// [GET] 내 급여 및 일정 조회 (알바생용)
router.get('/my-schedule', async (req, res) => {
    const { userId, year, month } = req.query;
    try {
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
        console.error("내 일정 조회 오류:", error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// [GET] 급여 계산 (주휴수당 + 야간수당)
router.get('/my-salary', async (req, res) => {
    const { userId, year, month } = req.query;

    function getNightOverlap(start, end) { 
        let overlapMillis = 0;
        const s = new Date(start);
        const e = new Date(end);
        
        const earlyStart = new Date(s); earlyStart.setHours(0,0,0,0);
        const earlyEnd = new Date(s); earlyEnd.setHours(6,0,0,0);
        const nightStart = new Date(s); nightStart.setHours(22,0,0,0);
        const nightEnd = new Date(s); nightEnd.setDate(nightEnd.getDate() + 1); nightEnd.setHours(6,0,0,0);

        const ranges = [{ s: earlyStart, e: earlyEnd }, { s: nightStart, e: nightEnd }];
        for (const range of ranges) {
            const maxStart = new Date(Math.max(s, range.s));
            const minEnd = new Date(Math.min(e, range.e));
            if (maxStart < minEnd) overlapMillis += (minEnd - maxStart);
        }
        return overlapMillis / (1000 * 60 * 60);
    }

    try {
        const userSql = "SELECT hourly_wage FROM users WHERE id = ?";
        const [user] = await db.executeQuery(userSql, [userId]);
        if (!user) return res.status(404).json({ message: '사용자 없음' });
        
        const hourlyWage = Number(user.hourly_wage);

        const attendSql = `
            SELECT check_in_time, check_out_time 
            FROM attendance 
            WHERE user_id = ? 
            AND MONTH(check_in_time) = ? 
            AND YEAR(check_in_time) = ?
            AND check_out_time IS NOT NULL
            ORDER BY check_in_time ASC
        `;
        const records = await db.executeQuery(attendSql, [userId, month, year]);

        const weeklyHours = {};
        const { totalMonthHours, totalNightHours } = records.reduce((acc, record) => {
            const start = new Date(record.check_in_time);
            const end = new Date(record.check_out_time);
            const diff = (end - start) / (1000 * 60 * 60);
            
            if (isNaN(diff) || diff < 0) return acc;

            const date = start.getDate();
            const weekNum = Math.ceil(date / 7);
            if (!weeklyHours[weekNum]) weeklyHours[weekNum] = 0;
            weeklyHours[weekNum] += diff;

            acc.totalMonthHours += diff;
            acc.totalNightHours += getNightOverlap(start, end);
            return acc;
        }, { totalMonthHours: 0, totalNightHours: 0 });

        let totalHolidayPay = 0;
        for (const [week, hours] of Object.entries(weeklyHours)) {
            if (hours >= 15) {
                const calcHours = hours > 40 ? 40 : hours;
                totalHolidayPay += (calcHours / 40) * 8 * hourlyWage;
            }
        }

        const baseSalary = Math.floor(totalMonthHours * hourlyWage);
        const totalNightPay = Math.floor(totalNightHours * hourlyWage * 0.5);
        const finalSalary = Math.floor(baseSalary + totalHolidayPay + totalNightPay);

        res.status(200).json({
            year, month, hourlyWage,
            totalHours: totalMonthHours.toFixed(1),
            baseSalary,
            totalHolidayPay: Math.floor(totalHolidayPay),
            totalNightPay,
            totalNightHours: totalNightHours.toFixed(1),
            finalSalary
        });

    } catch (error) {
        console.error("급여 조회 오류:", error);
        res.status(500).json({ message: '서버 오류' });
    }
});

module.exports = router;