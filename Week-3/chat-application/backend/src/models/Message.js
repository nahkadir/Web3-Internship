import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    edited: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
