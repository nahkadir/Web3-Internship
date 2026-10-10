import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  type: String,
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 }, // auto-delete after 30 days
});

export const WebhookEvent = mongoose.model("WebhookEvent", webhookEventSchema);
