import Notification from "../models/Notification.js";
import User, { ROLES } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { emitTo, userRoom } from "../realtime/socket.js";
import { logger } from "../utils/logger.js";

export const adminIds = async () =>
  (await User.find({ role: ROLES.ADMIN, isActive: true }).select("_id")).map(
    (u) => String(u._id),
  );

// never throws: a failed notification must not break the action that triggered it
export const notifyUsers = async (
  userIds,
  { ticket, type, title, message },
) => {
  try {
    const unique = [...new Set(userIds.filter(Boolean).map(String))];
    if (!unique.length) return;
    const docs = await Notification.insertMany(
      unique.map((userId) => ({
        userId,
        ticketId: ticket._id,
        type,
        title,
        message,
      })),
    );
    docs.forEach((d) =>
      emitTo(userRoom(d.userId), "notification", { notification: d.toJSON() }),
    );
  } catch (err) {
    logger.error("Notification failed:", err.message);
  }
};

export const listNotifications = async (userId, { page, limit, unread }) => {
  const filter = { userId };
  if (unread) filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return {
    notifications: notifications.map((n) => n.toJSON()),
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
};

export const markRead = async (userId, id) => {
  const n = await Notification.findOneAndUpdate(
    { _id: id, userId }, // scoped to the owner: other users' notifications look like 404
    { $set: { isRead: true } },
    { returnDocument: "after" },
  );
  if (!n) throw new ApiError(404, "Notification not found");
  return n.toJSON();
};

export const markAllRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } },
  );
  return { updated: result.modifiedCount };
};
