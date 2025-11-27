import { io } from "socket.io-client";
import { SERVER_URL } from "./config"; // 서버 주소

// 1. 소켓 객체를 여기서 딱 한 번만 생성합니다.
// autoConnect: false로 설정해서 내가 원할 때(로그인 후) 연결하도록 합니다.
export const socket = io(SERVER_URL, {
  autoConnect: false, 
  transports: ['websocket'], // 폴링 과정을 생략하고 바로 웹소켓 사용 (연결 속도 향상/중복 방지)
});