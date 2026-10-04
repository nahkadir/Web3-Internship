import { api } from "./client";

export const getNotifications = (page = 1) =>
  api(`/notifications?page=${page}`);
export const markAsRead = (id) =>
  api(`/notifications/${id}/read`, { method: "PATCH" });
export const markAllAsRead = () =>
  api("/notifications/read-all", { method: "PATCH" });
