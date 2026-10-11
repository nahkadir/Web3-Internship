import mongoose from "mongoose";
import { jsonOptions } from "../utils/jsonOptions.js";

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one active cart per user
    },
    checkingOut: { type: Boolean, default: false }, // short lock while an order is being created
    checkoutAt: Date,
  },
  { timestamps: true, toJSON: jsonOptions },
);

export const Cart = mongoose.model("Cart", cartSchema);
