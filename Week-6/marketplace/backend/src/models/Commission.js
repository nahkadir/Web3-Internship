import mongoose from "mongoose";
import { COMMISSION_STATUS } from "../constants/statuses.js";
import { jsonOptions } from "../utils/jsonOptions.js";

const amount = { type: Number, required: true, min: 0 };

const commissionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    orderItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderItem",
      required: true,
      unique: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    grossAmount: amount,
    commissionRate: { type: Number, required: true, min: 0, max: 1 }, // snapshot of the rate used
    commissionAmount: amount,
    vendorAmount: amount,
    status: {
      type: String,
      enum: Object.values(COMMISSION_STATUS),
      default: COMMISSION_STATUS.PENDING,
    },
  },
  { timestamps: true, toJSON: jsonOptions },
);

commissionSchema.index({ vendorId: 1, createdAt: -1 });
commissionSchema.index({ orderId: 1 });

export const Commission = mongoose.model("Commission", commissionSchema);
