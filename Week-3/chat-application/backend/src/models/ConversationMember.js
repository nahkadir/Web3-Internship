import mongoose from "mongoose";

const conversationMemberSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  joinedAt: { type: Date, default: Date.now },
});

// prevents the same user being added to the same conversation twice
conversationMemberSchema.index(
  { conversationId: 1, userId: 1 },
  { unique: true },
);

const ConversationMember = mongoose.model(
  "ConversationMember",
  conversationMemberSchema,
);
export default ConversationMember;
