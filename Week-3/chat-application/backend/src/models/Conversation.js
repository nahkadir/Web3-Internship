import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["private", "group"], required: true },
    name: { type: String, trim: true }, // only used for group conversations
  },
  { timestamps: true },
);

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
