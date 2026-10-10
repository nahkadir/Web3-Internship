import mongoose from "mongoose";
import { PAYMENT_STATUS } from "../constants/statuses.js";
import { jsonOptions } from "../utils/jsonOptions.js";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true, min: 0.01 }, // major units, e.g. 1500.50
    currency: { type: String, required: true },
    provider: { type: String, required: true },
    transactionId: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    active: { type: Boolean, default: true }, // true while PENDING / PROCESSING / PAID
    paymentMethod: { type: String, default: "CARD" },
    paidAt: Date,
    expiresAt: Date,
    failureReason: String,
    refund: {
      startedAt: Date,
      refundId: String,
      amount: Number,
      reason: String,
      refundedAt: Date,
      refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  },
  { timestamps: true, toJSON: jsonOptions },
);

// at most ONE live payment per order (stops double charging at the database level)
paymentSchema.index(
  { orderId: 1 },
  { unique: true, partialFilterExpression: { active: true } },
);
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

export const Payment = mongoose.model("Payment", paymentSchema);
