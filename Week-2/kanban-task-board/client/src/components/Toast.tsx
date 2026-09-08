interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

const Toast = ({ message, type = "success", onClose }: ToastProps) => {
  const colorClasses =
    type === "success"
      ? "bg-status-done/15 text-status-done border-status-done/30"
      : "bg-priority-high/15 text-priority-high border-priority-high/30";

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 border rounded-lg px-4 py-3 text-body shadow-md flex items-center gap-3 ${colorClasses}`}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="text-text-muted hover:text-text text-small"
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;
