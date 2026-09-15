import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { socket } from "../lib/socket";
import { useAuth } from "./AuthContext";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

type SocketContextType = {
  socket: typeof socket;
  status: ConnectionStatus;
};

const SocketContext = createContext<SocketContextType>({
  socket,
  status: "disconnected",
});

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");
    socket.auth = { token };
    setStatus("connecting");
    socket.connect();

    const handleConnect = () => setStatus("connected");
    const handleDisconnect = () => setStatus("disconnected");
    // const handleError = () => setStatus("error");
    const handleError = (err: Error) => {
      console.log("Socket connect_error:", err.message);
      setStatus("error");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
      socket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, status }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
