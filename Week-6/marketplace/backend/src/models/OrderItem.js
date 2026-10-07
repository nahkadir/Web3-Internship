import mongoose from "mongoose";
import { ORDER_STATUS } from "../constants/statuses.js";
import { jsonOptions } from "../utils/jsonOptions.js";

const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    productName: { type: String, required: true },
    productImage: { type: String, default: "" },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    }, // vendor fulfillment
  },
  { timestamps: true, toJSON: jsonOptions },
);

orderItemSchema.index({ orderId: 1 });
orderItemSchema.index({ vendorId: 1, orderId: 1 });
orderItemSchema.index({ vendorId: 1, createdAt: -1 });

export const OrderItem = mongoose.model("OrderItem", orderItemSchema);
