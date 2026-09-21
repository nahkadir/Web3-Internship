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
  { page = 1, limit = 30 } = {},
) => {
  const isMember = await verifyConversationMembership(conversationId, userId);
  if (!isMember) {
    const error = new Error("You are not a member of this conversation");
    error.statusCode = 403;
    throw error;
  }

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ conversationId })
      .sort({ createdAt: -1 }) // newest first for pagination math
      .skip(skip)
      .limit(limit)
      .populate("senderId", "name avatar")
      .lean(),
    Message.countDocuments({ conversationId }),
  ]);

  return {
    messages: messages.reverse(), // chronological order for display
    hasMore: skip + messages.length < total,
  };
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

export const editMessage = async (messageId, userId, newContent) => {
  const trimmed = newContent?.trim();
  if (!trimmed) {
    const error = new Error("Message content cannot be empty");
    error.statusCode = 400;
    throw error;
  }

  const message = await Message.findById(messageId);
  if (!message) {
    const error = new Error("Message not found");
    error.statusCode = 404;
    throw error;
  }

  // never trust client-claimed ownership — compare against the actual document
  if (message.senderId.toString() !== userId.toString()) {
    const error = new Error("You can only edit your own messages");
    error.statusCode = 403;
    throw error;
  }

  if (message.deleted) {
    const error = new Error("Cannot edit a deleted message");
    error.statusCode = 400;
    throw error;
  }

  message.content = trimmed;
  message.edited = true;
  await message.save();

  return message;
};

export const deleteMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId);
  if (!message) {
    const error = new Error("Message not found");
    error.statusCode = 404;
    throw error;
  }

  if (message.senderId.toString() !== userId.toString()) {
    const error = new Error("You can only delete your own messages");
    error.statusCode = 403;
    throw error;
  }

  message.content = "This message was deleted.";
  message.deleted = true;
  await message.save();

  return message;
};
