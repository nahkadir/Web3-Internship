import Like from "../models/Like.js";
import Post from "../models/Post.js";
import { ApiError } from "../utils/ApiError.js";
import { createNotification } from "./notification.service.js";

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

  let created = false;
  try {
    await Like.create({ post: postId, user: userId });
    created = true;
  } catch (err) {
    if (err.code !== 11000) throw err;
  }

  if (created) {
    await createNotification({
      recipient: post.author,
      actor: userId,
      type: "LIKE",
      post: postId,
    });
  }

  return getLikeStats(postId, userId);
};

export const unlikePost = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  await Like.deleteOne({ post: postId, user: userId }); // no-op if it wasn't liked

  return getLikeStats(postId, userId);
};
