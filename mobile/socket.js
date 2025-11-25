import { io } from "socket.io-client";


export const socket = io("http://10.74.242.197:5000", {
  transports: ["websocket"],
});
