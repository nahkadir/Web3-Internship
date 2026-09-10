import { useState, useEffect, useRef } from "react";
import { RiNotification3Line } from "react-icons/ri";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  type AppNotification,
} from "../api/notifications";
import { useAuth } from "../context/AuthContext";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const data = await getNotifications(token);
      setNotifications(data);
    } catch (err) {
      // Non-critical
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    if (!token) return;
    try {
      await markAsRead(id, token);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      // Silent fail is acceptable here — non-critical action
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await markAllAsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      // Silent fail
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative flex w-full items-center gap-2 hover:text-white px-3 py-2 rounded-lg cursor-pointer text-text text-sm"
      >
        <RiNotification3Line size={20} />
        Notification
        {unreadCount > 0 && (
          <span className="absolute right-0 bg-priority-high text-white text-small font-medium w-5 h-5 rounded-md flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-full ml-2 top-0 w-72 bg-card border border-border rounded-lg shadow-md z-50 flex flex-col max-h-96">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-text text-small font-medium">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-accent text-small"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <p className="text-text-muted text-small px-4 py-6 text-center">
                No notifications
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => !n.read && handleMarkRead(n._id)}
                  className={`w-full text-left px-4 py-3 border-b border-border last:border-0 ${
                    n.read ? "opacity-50" : "hover:bg-bg"
                  }`}
                >
                  <p className="text-white text-small">{n.message}</p>
                  <span className="text-text-muted text-small opacity-70">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
