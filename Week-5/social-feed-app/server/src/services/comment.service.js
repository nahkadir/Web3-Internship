import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import { ApiError } from "../utils/ApiError.js";

export const createComment = async (postId, userId, { content }) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const comment = await Comment.create({
    post: postId,
    author: userId,
    content,
  });

  await comment.populate("author", "name avatar");
  return comment;
};
