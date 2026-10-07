import mongoose from "mongoose";
import { PRODUCT_STATUS } from "../constants/statuses.js";
import { jsonOptions } from "../utils/jsonOptions.js";

const productSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, trim: true, maxlength: 5000, default: "" },
    price: {
      type: Number,
      required: true,
      validate: {
        validator: (v) => v > 0,
        message: "Price must be greater than zero",
      },
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
    },
    images: { type: [String], default: [] },
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.DRAFT,
    },
  },
  { timestamps: true, toJSON: jsonOptions },
);

// vendor / category / status / slug indexes (compound ones also serve their first field)
productSchema.index({ vendorId: 1, status: 1 });
productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1, price: 1 });

export const Product = mongoose.model("Product", productSchema);
