import { io } from "socket.io-client";

// ⚠️ 친구가 서버 만들면 IP 바꿔주기
export const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});
