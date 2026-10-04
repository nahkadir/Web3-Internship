import { useEffect, useState } from "react";
import NotificationItem from "../components/NotificationItem";
import { useNotifications } from "../context/NotificationsContext";
import * as notificationsApi from "../api/notifications";

export default function Notifications() {
  const { setUnreadCount, refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    notificationsApi
      .getNotifications(1)
      .then((data) => {
        setNotifications(data.notifications);
        setHasMore(data.pagination.hasMore);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationsApi.markAsRead(id);
    } catch {
      refreshUnreadCount(); // re-sync with server if the request failed
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationsApi.markAllAsRead();
    } catch {
      refreshUnreadCount();
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await notificationsApi.getNotifications(page + 1);
      setNotifications((prev) => [...prev, ...data.notifications]);
      setHasMore(data.pagination.hasMore);
      setPage(page + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-hairline bg-bg/80 px-4 py-3 backdrop-blur">
        <h1 className="text-xl font-extrabold text-text">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm font-bold text-x-blue hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading && (
        <p className="px-4 py-6 text-center text-secondary">
          Loading notifications...
        </p>
      )}
      {error && <p className="px-4 py-6 text-center text-red-500">{error}</p>}
      {!loading && !error && notifications.length === 0 && (
        <p className="px-4 py-10 text-center text-secondary">
          No notifications yet.
        </p>
      )}

      {notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} onRead={handleRead} />
      ))}

      {!loading && hasMore && (
        <div className="px-4 py-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-full border border-hairline px-4 py-2 text-sm font-bold text-x-blue hover:bg-hover disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
