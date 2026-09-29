import { ApiError } from "../utils/ApiError.js";
import Post from "../models/Post.js";

export const createPost = async (authorId, { content, imageUrl }) => {
  const post = await Post.create({
    author: authorId,
    content,
    imageUrl: imageUrl || "",
  });

  // populate author so the response includes basic author info
  await post.populate("author", "name avatar");
  return post;
  // returns the populated post to the caller.
};

// Without populate(), the frontend would receive only the author's ID.
// If it needs to display the author's name and avatar beside the post,
// it would need to make another API request to fetch that information.

export const getFeed = async ({ page = 1, limit = 10 }) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 10)); // cap to prevent abuse
  const skip = (pageNum - 1) * limitNum;

  const [posts, total] = await Promise.all([
    Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("author", "name avatar"),
    Post.countDocuments(),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    posts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasMore: pageNum < totalPages,
    },
  };
};

export const getPostById = async (id) => {
  const post = await Post.findById(id).populate("author", "name avatar");
  if (!post) throw new ApiError(404, "Post not found");
  return post;
};

export const updatePost = async (postId, userId, updates) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  if (post.author.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only update your own posts");
  }

  if (updates.content !== undefined) post.content = updates.content;
  if (updates.imageUrl !== undefined) post.imageUrl = updates.imageUrl;

  await post.save(); // triggers validation + updates updatedAt
  await post.populate("author", "name avatar");
  return post;
};

export const deletePost = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  if (post.author.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only delete your own posts");
  }

  await post.deleteOne();
};
