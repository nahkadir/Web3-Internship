import { useSocket } from "./context/SocketContext";

const STATUS_COLORS: Record<string, string> = {
  connected: "text-green-500",
  connecting: "text-yellow-500",
  disconnected: "text-gray-400",
  error: "text-accent-warn",
};

const STATUS_LABELS: Record<string, string> = {
  connected: "Connected",
  connecting: "Connecting...",
  disconnected: "Disconnected",
  error: "Connection lost",
};

const ConnectionStatus = () => {
  const { status } = useSocket();

  return (
    <div
      className={`flex items-center justify-center text-small font-medium leading-none ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </div>
  );
};

export default ConnectionStatus;
