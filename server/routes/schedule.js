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
// [GET] /api/schedule/my-salary - 주휴수당 + 야간수당 포함 급여 계산
router.get('/my-salary', async (req, res) => {
    const { userId, year, month } = req.query;

    // 🔥 야간 근무 시간 계산 함수 (핵심 로직)
    function getNightOverlap(start, end) {
        let overlapMillis = 0;

        // 비교 대상 1: "오늘 새벽" (00:00 ~ 06:00) - 예: 새벽 4시에 출근한 경우
        const earlyMorningStart = new Date(start); 
        earlyMorningStart.setHours(0, 0, 0, 0);
        const earlyMorningEnd = new Date(start); 
        earlyMorningEnd.setHours(6, 0, 0, 0);

        // 비교 대상 2: "오늘 밤 ~ 내일 새벽" (22:00 ~ 06:00) - 예: 밤 10시 넘어 퇴근한 경우
        const nightStart = new Date(start); 
        nightStart.setHours(22, 0, 0, 0);
        const nightEnd = new Date(start); 
        nightEnd.setDate(nightEnd.getDate() + 1); // 다음날
        nightEnd.setHours(6, 0, 0, 0);

        const ranges = [
            { s: earlyMorningStart, e: earlyMorningEnd },
            { s: nightStart, e: nightEnd }
        ];

        for (const range of ranges) {
            // 교집합(겹치는 시간) 구하기 로직
            const maxStart = new Date(Math.max(start, range.s));
            const minEnd = new Date(Math.min(end, range.e));

            if (maxStart < minEnd) {
                overlapMillis += (minEnd - maxStart);
            }
        }

        return overlapMillis / (1000 * 60 * 60); // 시간 단위로 변환
    }

    try {
        // 1. 시급 조회
        const userSql = "SELECT hourly_wage FROM users WHERE id = ?";
        const [user] = await db.executeQuery(userSql, [userId]);
        if (!user) return res.status(404).json({ message: '사용자 없음' });
        const hourlyWage = user.hourly_wage;

        // 2. 근무 기록 조회
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

        // 3. 계산 시작
        const weeklyHours = {}; // 주휴수당용 주별 시간 합계
        let totalMonthHours = 0; // 총 근무 시간
        let totalNightHours = 0; // 🔥 총 야간 근무 시간

        records.forEach(record => {
            const start = new Date(record.check_in_time);
            const end = new Date(record.check_out_time);
            const workHours = (end - start) / (1000 * 60 * 60);

            // 기본 시간 합산
            totalMonthHours += workHours;

            // 🔥 야간 시간 합산
            const nightHours = getNightOverlap(start, end);
            totalNightHours += nightHours;

            // 주휴수당용 주차별 합산
            const date = start.getDate();
            const weekNum = Math.ceil(date / 7);
            if (!weeklyHours[weekNum]) weeklyHours[weekNum] = 0;
            weeklyHours[weekNum] += workHours;
        });

        // 4. 주휴수당 계산
        let totalHolidayPay = 0;
        for (const [week, hours] of Object.entries(weeklyHours)) {
            if (hours >= 15) {
                const calcHours = hours > 40 ? 40 : hours;
                totalHolidayPay += (calcHours / 40) * 8 * hourlyWage;
            }
        }

        // 5. 🔥 야간수당 계산 (야간시간 * 시급 * 0.5)
        // 1.5배가 아니라 0.5배인 이유: 기본 1.0배는 이미 baseSalary(총 근무시간)에 포함되어 있기 때문
        const totalNightPay = totalNightHours * hourlyWage * 0.5;

        // 6. 최종 급여
        const baseSalary = Math.floor(totalMonthHours * hourlyWage);
        const finalSalary = Math.floor(baseSalary + totalHolidayPay + totalNightPay);

        res.status(200).json({
            year,
            month,
            hourlyWage,
            totalHours: totalMonthHours.toFixed(1),
            baseSalary,
            totalHolidayPay: Math.floor(totalHolidayPay),
            totalNightPay: Math.floor(totalNightPay), // 🔥 응답에 추가
            totalNightHours: totalNightHours.toFixed(1), // (선택) 몇 시간인지 표시용
            finalSalary
        });

    } catch (error) {
        console.error("급여 조회 오류:", error);
        res.status(500).json({ message: '서버 오류' });
    }
});

module.exports = router;