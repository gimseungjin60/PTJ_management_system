const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); // CORS 미들웨어 추가
//안녕하세요
// 라우터 모듈 불러오기 (지금은 빈 파일이므로 나중에 채워 넣습니다)
const authRouter = require('./routes/auth');
const attendanceRouter = require('./routes/attendance');
const noticesRouter = require('./routes/notices');
const managerRouter = require('./routes/manager'); 
const scheduleRouter = require('./routes/schedule');

const app = express();
const server = http.createServer(app);

// Socket.IO 설정 (실시간 알림용)
const io = new Server(server, {
    cors: {
        origin: "*", // 모든 클라이언트 접속 허용 (개발 환경)
        methods: ["GET", "POST"]
    }
});

// 미들웨어 설정
app.use(cors()); // CORS 활성화
app.use(express.json()); // 클라이언트가 보낸 JSON 데이터를 처리
// Socket.IO 연결 이벤트 (실시간 알림 처리의 핵심) 아래에 추가
app.set('socketio', io); // Socket.IO 객체를 Express 앱에 저장
app.set('connectedClients', {}); // 연결된 클라이언트 ID 저장소 (추가 구현 필요)


// API 라우터 등록
app.use('/api/auth', authRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/notices', noticesRouter);
app.use('/api/manager', managerRouter);
app.use('/api/schedule', scheduleRouter); // 라우터 등록

// 기본 라우트 (서버 작동 확인용)
app.get('/', (req, res) => {
    res.send('Welcome to Express Backend Server!');
});

// Socket.IO 연결 이벤트 (실시간 알림 처리의 핵심)
io.on('connection', (socket) => {
    console.log(`✅ 클라이언트 연결됨: ${socket.id}`);

    // TODO: 사용자 ID를 받아서 소켓을 관리하는 로직이 필요함.

    socket.on('disconnect', () => {
        console.log(`❌ 클라이언트 연결 끊김: ${socket.id}`);
    });
});

const PORT = 5000; // 클라이언트 친구가 5000번 포트로 약속했으므로 5000번 사용
server.listen(PORT, () => {
    console.log(`🚀 Express Server running on http://localhost:${PORT}`);
});


