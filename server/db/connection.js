const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',   // MySQL 사용자 이름
    password: 'rootroot', // MySQL 비밀번호
    database: 'alba_system', // 데이터베이스 이름
};

// 데이터베이스 연결 풀 생성
const pool = mysql.createPool(dbConfig);

// 모든 쿼리를 실행할 공통 함수
async function executeQuery(sql, params = []) {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows, fields] = await connection.execute(sql, params);
        return rows;
    } catch (error) {
        console.error("Database query error:", error);
        throw error;
    } finally {
        if (connection) connection.release(); // 연결 반환
    }
}

module.exports = {
    pool,
    executeQuery,
};