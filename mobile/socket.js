import { io } from "socket.io-client";
import { SERVER_URL } from "./config"; // 서버 주소


export const socket = io("http://175.116.147.194:5000", {
  transports: ["websocket"],
});
