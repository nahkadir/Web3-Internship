import mongoose from "mongoose";

export const NOTIFICATION_TYPE = Object.freeze({
  TICKET_CREATED: "TICKET_CREATED",
  TICKET_ASSIGNED: "TICKET_ASSIGNED",
  NEW_REPLY: "NEW_REPLY",
  STATUS_CHANGED: "STATUS_CHANGED",
  TICKET_RESOLVED: "TICKET_RESOLVED",
  SLA_WARNING: "SLA_WARNING",
  SLA_BREACHED: "SLA_BREACHED",
});

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 500 },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

notificationSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Notification", notificationSchema);
