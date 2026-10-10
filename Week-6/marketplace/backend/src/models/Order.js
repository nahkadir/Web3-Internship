import mongoose from "mongoose";
import { ORDER_STATUS, PAYMENT_STATUS } from "../constants/statuses.js";
import { jsonOptions } from "../utils/jsonOptions.js";

const money = { type: Number, required: true, min: 0, default: 0 };

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", ...Object.values(PAYMENT_STATUS)],
      default: "UNPAID",
    },
    subtotal: money,
    shippingAmount: money,
    discountAmount: money,
    taxAmount: money,
    totalAmount: money,
    paymentMethod: { type: String, default: "ONLINE" },
  },
  { timestamps: true, toJSON: jsonOptions },
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, paymentStatus: 1, createdAt: 1 });

export const Order = mongoose.model("Order", orderSchema);
