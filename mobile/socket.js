import { io } from "socket.io-client";

// ⚠️ 친구 서버 켜지면 IP 변경해야 함
export const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});
