import mongoose from "mongoose";
import { jsonOptions } from "../utils/jsonOptions.js";

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    }, // null = system
    actorRole: { type: String, default: "SYSTEM" },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }, // ids and statuses only, never secrets
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: jsonOptions },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
