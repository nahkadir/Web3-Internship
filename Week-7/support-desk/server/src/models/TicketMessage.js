import mongoose from "mongoose";

export const MESSAGE_TYPE = Object.freeze({ USER: "USER", SYSTEM: "SYSTEM" });

const ticketMessageSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    messageType: {
      type: String,
      enum: Object.values(MESSAGE_TYPE),
      default: MESSAGE_TYPE.USER,
    },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ticketMessageSchema.index({ ticketId: 1, _id: -1 });

ticketMessageSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("TicketMessage", ticketMessageSchema);
