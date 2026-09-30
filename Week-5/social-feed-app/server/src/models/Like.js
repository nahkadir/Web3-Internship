import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  { timestamps: true },
);

// One like per user per post, prevents duplicates
likeSchema.index({ user: 1, post: 1 }, { unique: true });

// Fast "how many likes does this post have" lookups
likeSchema.index({ post: 1 });

const Like = mongoose.model("Like", likeSchema);
export default Like;
