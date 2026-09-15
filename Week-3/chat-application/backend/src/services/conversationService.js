import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";

export const findOrCreatePrivateConversation = async (userId, recipientId) => {
  const currentUserConvos = await ConversationMember.find({
    userId,
  }).select("conversationId");

  const convoIds = currentUserConvos.map((m) => m.conversationId);

  const existingMember = await ConversationMember.findOne({
    conversationId: { $in: convoIds },
    userId: recipientId,
  }).populate({
    path: "conversationId",
    match: { type: "private" },
  });

  if (existingMember?.conversationId) {
    return existingMember.conversationId;
  }

  const conversation = await Conversation.create({ type: "private" });

  await ConversationMember.insertMany([
    { conversationId: conversation._id, userId },
    { conversationId: conversation._id, userId: recipientId },
  ]);

  return conversation;
};
