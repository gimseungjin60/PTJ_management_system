import { io } from "socket.io-client";
import { SERVER_URL } from "./config"; // 서버 주소


export const socket = io(SERVER_URL, {
  transports: ["websocket"],
});

