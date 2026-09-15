import { useSocket } from "./context/SocketContext";

const colors = {
  connecting: "bg-yellow-400",
  connected: "bg-green-500",
  disconnected: "bg-gray-400",
  error: "bg-red-500",
};

export const ConnectionStatus = () => {
  const { status } = useSocket();
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className={`h-2 w-2 rounded-full ${colors[status]}`} />
      {status}
    </div>
  );
};
