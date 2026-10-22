import { io } from "socket.io-client";
import api from "./api";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
  reconnectionDelayMax: 5000,
  auth: (cb) => {
    api
      .get("/auth/socket-token")
      .then((res) => cb({ token: res.data.data.token }))
      .catch(() => cb({}));
  },
});

export default socket;
