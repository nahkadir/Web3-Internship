import mongoose from "mongoose";
import { VENDOR_STATUS } from "../constants/statuses.js";
import { jsonOptions } from "../utils/jsonOptions.js";

const vendorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one vendor profile per user, enforced by the database
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    storeDescription: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    logo: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: Object.values(VENDOR_STATUS),
      default: VENDOR_STATUS.PENDING,
    },
  },
  { timestamps: true, toJSON: jsonOptions },
);

vendorSchema.index({ status: 1, createdAt: -1 });

export const Vendor = mongoose.model("Vendor", vendorSchema);
