import mongoose from "mongoose";

const idempotencyKeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    idempotencyKey: { type: String, required: true },
    requestHash: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    responseData: { type: mongoose.Schema.Types.Mixed, default: null },
    statusCode: { type: Number, default: null },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    },
  },
  { timestamps: true },
);

// The actual concurrency guarantee: MongoDB rejects a second document
// with the same (userId, idempotencyKey) pair, atomically, no race window.
idempotencyKeySchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });

// TTL index: MongoDB automatically deletes documents once expiresAt passes,
// so old idempotency records don't accumulate forever.
idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("IdempotencyKey", idempotencyKeySchema);
