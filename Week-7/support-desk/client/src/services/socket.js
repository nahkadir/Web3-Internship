import { io } from "socket.io-client";

// one shared connection; SocketProvider connects/disconnects it with the login state
const socket = io(import.meta.env.VITE_SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
  reconnectionDelayMax: 5000,
});

export default socket;
