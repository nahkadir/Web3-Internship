import Post from "../models/Post.js";
import Follow from "../models/Follow.js";
import Like from "../models/Like.js";
import Comment from "../models/Comment.js";

export const getPersonalizedFeed = async (
  currentUserId,
  { page = 1, limit = 10 },
) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const myFollows = await Follow.find({ follower: currentUserId })
    .select("following")
    .lean();
  const followingIds = myFollows.map((f) => f.following);
  const relevantAuthors = [...followingIds, currentUserId]; // followed users + myself

  const [posts, total] = await Promise.all([
    Post.find({ author: { $in: relevantAuthors } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("author", "name avatar"),
    Post.countDocuments({ author: { $in: relevantAuthors } }),
  ]);

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
    Like.find({ post: { $in: postIds }, user: currentUserId })
      .select("post")
      .lean(),
  ]);
  const likeCountMap = new Map(
    likeCounts.map((l) => [l._id.toString(), l.count]),
  );
  const commentCountMap = new Map(
    commentCounts.map((c) => [c._id.toString(), c.count]),
  );
  const likedSet = new Set(myLikes.map((l) => l.post.toString()));

  const enriched = posts.map((post) => ({
    ...post.toJSON(),
    likeCount: likeCountMap.get(post._id.toString()) || 0,
    commentCount: commentCountMap.get(post._id.toString()) || 0,
    likedByMe: likedSet.has(post._id.toString()),
  }));

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
