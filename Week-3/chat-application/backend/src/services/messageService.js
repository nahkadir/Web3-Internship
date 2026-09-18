import Message from "../models/Message.js";
import { verifyConversationMembership } from "./conversationService.js";

export const createMessage = async ({ conversationId, senderId, content }) => {
  const isMember = await verifyConversationMembership(conversationId, senderId);
  if (!isMember) {
    const error = new Error("You are not a member of this conversation");
    error.statusCode = 403;
    throw error;
  }

  const trimmed = content?.trim();
  if (!trimmed) {
    const error = new Error("Message content cannot be empty");
    error.statusCode = 400;
    throw error;
  }

  const message = await Message.create({
    conversationId,
    senderId,
    content: trimmed,
    messageType: "text",
  });

  return message;
};

export const getConversationMessages = async (
  conversationId,
  userId,
  { limit = 50, before } = {},
) => {
  const isMember = await verifyConversationMembership(conversationId, userId);
  if (!isMember) {
    const error = new Error("You are not a member of this conversation");
    error.statusCode = 403;
    throw error;
  }

  const query = { conversationId };
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("senderId", "name avatar")
    .lean();

  return messages.reverse(); // chronological order for display
};

export const markMessagesAsRead = async (conversationId, userId) => {
  const isMember = await verifyConversationMembership(conversationId, userId);
  if (!isMember) {
    const error = new Error("You are not a member of this conversation");
    error.statusCode = 403;
    throw error;
  }

  // only messages from OTHERS, not already read by this user
  const unread = await Message.find({
    conversationId,
    senderId: { $ne: userId },
    readBy: { $ne: userId },
  }).select("_id");

  if (unread.length === 0) return [];

  const messageIds = unread.map((m) => m._id);

  await Message.updateMany(
    { _id: { $in: messageIds } },
    { $addToSet: { readBy: userId } },
  );

  return messageIds;
};
