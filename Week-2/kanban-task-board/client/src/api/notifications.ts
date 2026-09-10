export interface AppNotification {
  _id: string;
  recipient: string;
  type: string;
  task: { _id: string; title: string };
  message: string;
  read: boolean;
  createdAt: string;
}

const BASE_URL = "http://localhost:5000/api/notifications";

export const getNotifications = async (
  token: string,
): Promise<AppNotification[]> => {
  const res = await fetch(BASE_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await res.json();
  if (!res.ok)
    throw new Error(result.message || "Failed to fetch notifications");
  return result;
};

export const markAsRead = async (
  id: string,
  token: string,
): Promise<AppNotification> => {
  const res = await fetch(`${BASE_URL}/${id}/read`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Failed to mark as read");
  return result;
};

export const markAllAsRead = async (token: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/read-all`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to mark all as read");
};
