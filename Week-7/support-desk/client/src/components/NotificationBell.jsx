import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import socket from "../services/socket";
import useSocketEvent from "../hooks/useSocketEvent";
import { getErrorMessage } from "../utils/getErrorMessage";

export default function NotificationBell() {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/notifications", { params: { limit: 15 } });
      setItems(res.data.data.notifications);
      setUnread(res.data.data.unreadCount);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000); // fallback when sockets are unavailable
    socket.on("connect", load); // catch up after a reconnect
    return () => {
      clearInterval(timer);
      socket.off("connect", load);
    };
  }, [load]);

  useSocketEvent("notification", load); // re-fetching keeps the count exact and avoids double counting

  useEffect(() => {
    const close = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const openItem = async (n) => {
    setOpen(false);
    if (!n.isRead) {
      setItems((prev) =>
        prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)),
      );
      setUnread((u) => Math.max(0, u - 1));
      api.patch(`/notifications/${n._id}/read`).catch(load);
    }
    navigate(`/tickets/${n.ticketId}`);
  };

  const markAll = async () => {
    try {
      await api.patch("/notifications/read-all");
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setUnread(0);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        className="relative p-2 rounded-lg hover:bg-gray-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white border rounded-xl shadow-lg z-20">
          <div className="flex items-center justify-between p-3 border-b">
            <span className="font-semibold text-sm">Notifications</span>
            <button
              onClick={markAll}
              disabled={unread === 0}
              className="text-xs text-indigo-600 disabled:opacity-40"
            >
              Mark all as read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <p className="p-4 text-sm text-gray-500 text-center">
                Loading...
              </p>
            )}
            {error && (
              <p className="p-3 text-xs text-red-600 bg-red-50">{error}</p>
            )}
            {!loading && !error && items.length === 0 && (
              <p className="p-6 text-sm text-gray-500 text-center">
                You're all caught up.
              </p>
            )}
            {items.map((n) => (
              <button
                key={n._id}
                onClick={() => openItem(n)}
                className={`w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-gray-50 ${n.isRead ? "" : "bg-indigo-50"}`}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-gray-600 truncate">{n.message}</p>
                <p className="text-[11px] text-gray-400">
                  {new Date(n.createdAt).toLocaleString([], {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
