import Notification from "../models/Notification.js";
import { ApiError } from "../utils/ApiError.js";

export const createNotification = async ({
  recipient,
  actor,
  type,
  post = null,
  comment = null,
}) => {
  // "Do not create a notification when you act on yourself" — enforced once, here,
  // so every trigger site below gets this for free instead of re-checking it each time.
  if (recipient.toString() === actor.toString()) return null;

  return Notification.create({ recipient, actor, type, post, comment });
};

export const getNotifications = async (userId, { page = 1, limit = 20 }) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("actor", "name avatar")
      .populate("post", "content")
      .populate("comment", "content"),
    Notification.countDocuments({ recipient: userId }),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    notifications,
    unreadCount,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasMore: pageNum < totalPages,
    },
  };
};

export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) throw new ApiError(404, "Notification not found");

  if (notification.recipient.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only mark your own notifications as read");
  }

  notification.isRead = true;
  await notification.save();
  return notification;
};

export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true } },
  );
  return { modifiedCount: result.modifiedCount };
};
