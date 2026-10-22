import mongoose from "mongoose";
import Counter from "./Counter.js";
import {
  STATUS,
  PRIORITY,
  CATEGORY,
  PRIORITY_RANK,
} from "../constants/ticket.js";
import { applySlaDeadlines } from "../constants/sla.js";

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
    priorityRank: { type: Number, default: PRIORITY_RANK.MEDIUM },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.OPEN,
      index: true,
    },
    resolvedAt: { type: Date, default: null },

    // SLA
    firstResponseDueAt: { type: Date, default: null },
    resolutionDueAt: { type: Date, default: null },
    firstRespondedAt: { type: Date, default: null },
    slaFirstResponseBreached: { type: Boolean, default: false },
    slaResolutionBreached: { type: Boolean, default: false },
    slaWarned: {
      firstResponse: { type: Boolean, default: false },
      resolution: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ createdBy: 1, createdAt: -1 });
ticketSchema.index({ assignedTo: 1, createdAt: -1 });
ticketSchema.index({ status: 1, firstRespondedAt: 1, firstResponseDueAt: 1 });
ticketSchema.index({ status: 1, resolvedAt: 1, resolutionDueAt: 1 });

ticketSchema.pre("validate", async function () {
  if (this.isNew && !this.ticketNumber) {
    const counter = await Counter.findOneAndUpdate(
      { _id: "ticket" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true },
    );
    this.ticketNumber = `TKT-${String(counter.seq).padStart(6, "0")}`;
  }
  if (this.isNew || this.isModified("priority")) {
    this.priorityRank = PRIORITY_RANK[this.priority];
    applySlaDeadlines(this);
  }
});

ticketSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.priorityRank;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Ticket", ticketSchema);
