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
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SocketStatus>("disconnected");

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

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, status }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
};
