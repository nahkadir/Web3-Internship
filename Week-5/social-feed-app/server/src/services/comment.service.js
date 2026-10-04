import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import { ApiError } from "../utils/ApiError.js";
import { createNotification } from "./notification.service.js";

export const createComment = async (postId, userId, { content }) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const comment = await Comment.create({
    post: postId,
    author: userId,
    content,
  });
  await comment.populate("author", "name avatar");

  await createNotification({
    recipient: post.author,
    actor: userId,
    type: "COMMENT",
    post: postId,
    comment: comment._id,
  });

  return comment;
};

export const getPostComments = async (postId, { page = 1, limit = 20 }) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [comments, total] = await Promise.all([
    Comment.find({ post: postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("author", "name avatar"),
    Comment.countDocuments({ post: postId }),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    comments,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasMore: pageNum < totalPages,
    },
  };
};

export const updateComment = async (commentId, userId, { content }) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  if (comment.author.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only update your own comments");
  }

  comment.content = content;
  await comment.save();
  await comment.populate("author", "name avatar");
  return comment;
};

export const deleteComment = async (commentId, userId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  if (comment.author.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only delete your own comments");
  }

  await comment.deleteOne();
};
