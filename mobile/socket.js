import { io } from "socket.io-client";


export const socket = io("http://175.116.147.194:5000", {
  transports: ["websocket"],
});
