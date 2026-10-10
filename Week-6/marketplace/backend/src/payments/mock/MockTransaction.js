import mongoose from "mongoose";

const mockTransactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true }, // minor units
    currency: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "cancelled", "refunded"],
      default: "pending",
    },
    metadata: { paymentId: String, orderId: String, orderNumber: String },
    successUrl: String,
    cancelUrl: String,
    failureReason: String,
    expiresAt: Date,
    lastEvent: { id: String, type: { type: String } },
    refunds: [
      { refundId: String, amount: Number, reason: String, createdAt: Date },
    ],
  },
  { timestamps: true },
);

export const MockTransaction = mongoose.model(
  "MockTransaction",
  mockTransactionSchema,
);
