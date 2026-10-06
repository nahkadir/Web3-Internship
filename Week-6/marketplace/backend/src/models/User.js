import mongoose from "mongoose";
import { ROLES } from "../constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true, // creates a unique index
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false }, // excluded from queries by default
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password; // never returned in API responses
        return ret;
      },
    },
  },
);

userSchema.index({ role: 1 });

export const User = mongoose.model("User", userSchema);
