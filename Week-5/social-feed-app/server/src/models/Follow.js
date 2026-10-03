import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// One follow relationship per pair — this is what prevents duplicate follows
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Fast "who follows this user" and "who does this user follow" lookups
followSchema.index({ following: 1 });
followSchema.index({ follower: 1 });

const Follow = mongoose.model("Follow", followSchema);
export default Follow;
