import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "A comment must belong to a post"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A comment must belong to a user"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [300, "Comment must be at most 300 characters"],
    },
  },
  { timestamps: true },
);

// Fetching a post's comments, sorted, is the main query pattern
commentSchema.index({ post: 1, createdAt: -1 });

commentSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
