import mongoose from "mongoose";
import { jsonOptions } from "../utils/jsonOptions.js";

const cartItemSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },
  },
  { timestamps: true, toJSON: jsonOptions },
);

// no duplicate cart items for the same product
cartItemSchema.index({ cartId: 1, productId: 1 }, { unique: true });

export const CartItem = mongoose.model("CartItem", cartItemSchema);
