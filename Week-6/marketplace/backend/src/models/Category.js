import mongoose from "mongoose";
import { jsonOptions } from "../utils/jsonOptions.js";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, trim: true, maxlength: 300, default: "" },
  },
  { timestamps: true, toJSON: jsonOptions },
);

export const Category = mongoose.model("Category", categorySchema);
