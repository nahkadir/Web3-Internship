import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import * as notificationsApi from "../api/notifications";
import { useAuth } from "./AuthContext";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(() => {
    if (!user) return;
    notificationsApi
      .getNotifications(1)
      .then((data) => setUnreadCount(data.unreadCount))
      .catch(() => {}); // badge just silently stays as-is on failure
  }, [user]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  return (
    <NotificationsContext.Provider
      value={{ unreadCount, setUnreadCount, refreshUnreadCount }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
