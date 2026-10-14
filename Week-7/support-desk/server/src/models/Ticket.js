import mongoose from "mongoose";
import Counter from "./Counter.js";
import {
  STATUS,
  PRIORITY,
  CATEGORY,
  PRIORITY_RANK,
} from "../constants/ticket.js";

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      minlength: 5,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(CATEGORY),
      default: CATEGORY.GENERAL,
    },
    priority: {
      type: String,
      enum: Object.values(PRIORITY),
      default: PRIORITY.MEDIUM,
    },
    priorityRank: { type: Number, default: PRIORITY_RANK.MEDIUM }, // lets us sort priority correctly
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.OPEN,
      index: true,
    },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ticketSchema.index({ createdAt: -1 });

ticketSchema.pre("validate", async function () {
  if (this.isNew && !this.ticketNumber) {
    const counter = await Counter.findOneAndUpdate(
      { _id: "ticket" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    this.ticketNumber = `TKT-${String(counter.seq).padStart(6, "0")}`;
  }
  if (this.isModified("priority"))
    this.priorityRank = PRIORITY_RANK[this.priority];
});

ticketSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.priorityRank;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Ticket", ticketSchema);
