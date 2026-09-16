import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

export const findOrCreatePrivateConversation = async (userId, recipientId) => {
  if (userId.toString() === recipientId.toString()) {
    const error = new Error("Cannot create a conversation with yourself");
    error.statusCode = 400;
    throw error;
  }

  // Find private conversations userId belongs to
  const userMemberships = await ConversationMember.find({ userId }).select(
    "conversationId",
  );
  const userConversationIds = userMemberships.map((m) => m.conversationId);

  // Check if recipient is also a member of any of those, and it's type "private"
  const existingMembership = await ConversationMember.findOne({
    userId: recipientId,
    conversationId: { $in: userConversationIds },
  });

  if (existingMembership) {
    const conversation = await Conversation.findOne({
      _id: existingMembership.conversationId,
      type: "private",
    });
    if (conversation) return conversation;
  }

  // None found — create a new one
  const conversation = await Conversation.create({ type: "private" });

  await ConversationMember.insertMany([
    { conversationId: conversation._id, userId },
    { conversationId: conversation._id, userId: recipientId },
  ]);

  return conversation;
};

export const verifyConversationMembership = async (conversationId, userId) => {
  const membership = await ConversationMember.findOne({
    conversationId,
    userId,
  });
  return !!membership;
};

export const createGroupConversation = async (
  creatorId,
  { name, memberIds },
) => {
  if (!name || !name.trim()) {
    const error = new Error("Group name is required");
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(memberIds) || memberIds.length < 2) {
    const error = new Error("A group requires at least 2 other members");
    error.statusCode = 400;
    throw error;
  }

  // Remove duplicates, and make sure creator isn't double-counted
  const uniqueMemberIds = [
    ...new Set(memberIds.map((id) => id.toString())),
  ].filter((id) => id !== creatorId.toString());

  if (uniqueMemberIds.length < 2) {
    const error = new Error("Duplicate or invalid members provided");
    error.statusCode = 400;
    throw error;
  }

  // Confirm every member actually exists
  const existingUsers = await User.find({
    _id: { $in: uniqueMemberIds },
  }).select("_id");
  if (existingUsers.length !== uniqueMemberIds.length) {
    const error = new Error("One or more member IDs do not exist");
    error.statusCode = 400;
    throw error;
  }

  const conversation = await Conversation.create({
    type: "group",
    name: name.trim(),
  });

  const allMemberIds = [creatorId.toString(), ...uniqueMemberIds];

  await ConversationMember.insertMany(
    allMemberIds.map((userId) => ({
      conversationId: conversation._id,
      userId,
    })),
  );

  return conversation;
};

// get all conversations (private or group) belonging to a user, along with their members and most recent message
export const getUserConversations = async (userId) => {
  const memberships = await ConversationMember.find({ userId }).select(
    "conversationId",
  );
  const conversationIds = memberships.map((m) => m.conversationId);

  const conversations = await Conversation.find({
    _id: { $in: conversationIds },
  })
    .sort({ updatedAt: -1 })
    .lean();

  // For each conversation, attach its members and last message
  const enriched = await Promise.all(
    conversations.map(async (conv) => {
      const members = await ConversationMember.find({
        conversationId: conv._id,
      })
        .populate("userId", "name avatar")
        .lean();

      const lastMessage = await Message.findOne({ conversationId: conv._id })
        .sort({ createdAt: -1 })
        .select("content senderId createdAt")
        .lean();

      return {
        id: conv._id,
        type: conv.type,
        name: conv.name,
        members: members.map((m) => m.userId),
        lastMessage: lastMessage
          ? { content: lastMessage.content, createdAt: lastMessage.createdAt }
          : null,
        updatedAt: conv.updatedAt,
      };
    }),
  );

  return enriched;
};
