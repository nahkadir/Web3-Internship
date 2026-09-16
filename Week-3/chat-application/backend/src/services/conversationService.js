import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";

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
