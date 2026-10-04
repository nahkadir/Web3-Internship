import { asyncHandler } from "../utils/asyncHandler.js";
import * as notificationService from "../services/notification.service.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { notifications, unreadCount, pagination } =
    await notificationService.getNotifications(req.user._id, { page, limit });
  res.status(200).json({ notifications, unreadCount, pagination });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.params.id,
    req.user._id,
  );
  res
    .status(200)
    .json({ message: "Notification marked as read", notification });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);
  res
    .status(200)
    .json({ message: "All notifications marked as read", ...result });
});
