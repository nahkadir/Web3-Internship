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
  },
  { timestamps: true, toJSON: jsonOptions },
);

export const Cart = mongoose.model("Cart", cartSchema);
