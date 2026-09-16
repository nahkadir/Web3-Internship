import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { socket } from "../lib/socket";
import { useAuth } from "./AuthContext";

type SocketStatus = "connecting" | "connected" | "disconnected" | "error";

type SocketContextType = {
  socket: typeof socket;
  status: SocketStatus;
  onlineUserIds: Set<string>;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      socket.disconnect();
      setStatus("disconnected");
      return;
    }

    const token = localStorage.getItem("token");
    socket.auth = { token };

    setStatus("connecting");
    socket.connect();

    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("disconnected");
    const onConnectError = () => setStatus("error");
    const onUserOnline = ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => new Set(prev).add(userId));
    };
    const onUserOffline = ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    socket.on("user_online", onUserOnline);
    socket.on("user_offline", onUserOffline);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("user_online", onUserOnline);
      socket.off("user_offline", onUserOffline);
      socket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, status, onlineUserIds }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
};
