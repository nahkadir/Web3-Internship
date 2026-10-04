import { ApiError } from "../utils/ApiError.js";
import Post from "../models/Post.js";
import Like from "../models/Like.js";
import Comment from "../models/Comment.js";

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

export const getFeed = async (
  { page = 1, limit = 10, search },
  currentUserId,
) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = search?.trim()
    ? { content: { $regex: search.trim(), $options: "i" } }
    : {};

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("author", "name avatar"),
    Post.countDocuments(filter),
  ]);

  const enriched = await enrichPosts(posts, currentUserId);
  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    posts: enriched,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasMore: pageNum < totalPages,
    },
  };
};

export const getPostById = async (id, currentUserId) => {
  const post = await Post.findById(id).populate("author", "name avatar");
  if (!post) throw new ApiError(404, "Post not found");

  const [enriched] = await enrichPosts([post], currentUserId);
  return enriched;
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

const enrichPosts = async (posts, currentUserId) => {
  const postIds = posts.map((p) => p._id);

  const [likeCounts, commentCounts, myLikes] = await Promise.all([
    Like.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: "$post", count: { $sum: 1 } } },
    ]),
    Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: "$post", count: { $sum: 1 } } },
    ]),
    currentUserId
      ? Like.find({ post: { $in: postIds }, user: currentUserId })
          .select("post")
          .lean()
      : [],
  ]);

  // Helpers

  const likeCountMap = new Map(
    likeCounts.map((l) => [l._id.toString(), l.count]),
  );
  const commentCountMap = new Map(
    commentCounts.map((c) => [c._id.toString(), c.count]),
  );
  const likedSet = new Set(myLikes.map((l) => l.post.toString()));

  return posts.map((post) => ({
    ...post.toJSON(),
    likeCount: likeCountMap.get(post._id.toString()) || 0,
    commentCount: commentCountMap.get(post._id.toString()) || 0,
    likedByMe: likedSet.has(post._id.toString()),
  }));
};
