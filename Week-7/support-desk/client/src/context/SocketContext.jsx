import { createContext, useContext, useEffect, useState } from "react";
import socket from "../services/socket";
import { useAuth } from "./AuthContext";

const SocketContext = createContext("disconnected");

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id;
  const [status, setStatus] = useState("disconnected"); // connecting | connected | disconnected | error

  useEffect(() => {
    if (!userId || !import.meta.env.VITE_SOCKET_URL) return;

    const onConnect = () => setStatus("connected");
    const onDisconnect = (reason) => {
      setStatus("disconnected");
      if (reason === "io server disconnect") socket.connect(); // server-initiated drops don't auto-retry
    };
    const onError = () => setStatus("error");
    const onAttempt = () => setStatus("connecting");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);
    socket.io.on("reconnect_attempt", onAttempt);

    setStatus("connecting");
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
      socket.io.off("reconnect_attempt", onAttempt);
      socket.disconnect();
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={status}>{children}</SocketContext.Provider>
  );
}

export const useSocketStatus = () => useContext(SocketContext);
