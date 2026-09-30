import Like from "../models/Like.js";
import Post from "../models/Post.js";
import { ApiError } from "../utils/ApiError.js";

const getLikeStats = async (postId, userId) => {
  const [likeCount, likedByMe] = await Promise.all([
    Like.countDocuments({ post: postId }),
    Like.exists({ post: postId, user: userId }),
  ]);
  return { likeCount, likedByMe: Boolean(likedByMe) };
};

export const likePost = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  try {
    await Like.create({ post: postId, user: userId });
  } catch (err) {
    // 11000 = duplicate key -> user already liked this post, treat as a no-op
    if (err.code !== 11000) throw err;
  }

  return getLikeStats(postId, userId);
};

export const unlikePost = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  await Like.deleteOne({ post: postId, user: userId }); // no-op if it wasn't liked

  return getLikeStats(postId, userId);
};
