import Follow from "../models/Follow.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

export const followUser = async (targetId, currentUserId) => {
  if (targetId.toString() === currentUserId.toString()) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const target = await User.findById(targetId);
  if (!target) throw new ApiError(404, "User not found");

  try {
    await Follow.create({ follower: currentUserId, following: targetId });
  } catch (err) {
    if (err.code !== 11000) throw err; // already following -> no-op, same pattern as Like
  }

  const followersCount = await Follow.countDocuments({ following: targetId });
  return { followersCount, isFollowing: true };
};

export const unfollowUser = async (targetId, currentUserId) => {
  const target = await User.findById(targetId);
  if (!target) throw new ApiError(404, "User not found");

  await Follow.deleteOne({ follower: currentUserId, following: targetId });

  const followersCount = await Follow.countDocuments({ following: targetId });
  return { followersCount, isFollowing: false };
};

const paginate = (page, limit) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

const attachIsFollowing = async (users, currentUserId) => {
  if (!currentUserId) return users.map((u) => ({ ...u, isFollowing: false }));

  const ids = users.map((u) => u.id);
  const myFollows = await Follow.find({
    follower: currentUserId,
    following: { $in: ids },
  })
    .select("following")
    .lean();
  const followingSet = new Set(myFollows.map((f) => f.following.toString()));

  return users.map((u) => ({
    ...u,
    isFollowing: followingSet.has(u.id.toString()),
  }));
};

export const getFollowers = async (userId, { page, limit }, currentUserId) => {
  const target = await User.findById(userId);
  if (!target) throw new ApiError(404, "User not found");

  const { pageNum, limitNum, skip } = paginate(page, limit);

  const [follows, total] = await Promise.all([
    Follow.find({ following: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("follower", "name avatar bio"),
    Follow.countDocuments({ following: userId }),
  ]);

  const users = follows.map((f) => f.follower.toJSON());
  const enriched = await attachIsFollowing(users, currentUserId);
  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    users: enriched,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasMore: pageNum < totalPages,
    },
  };
};

export const getFollowing = async (userId, { page, limit }, currentUserId) => {
  const target = await User.findById(userId);
  if (!target) throw new ApiError(404, "User not found");

  const { pageNum, limitNum, skip } = paginate(page, limit);

  const [follows, total] = await Promise.all([
    Follow.find({ follower: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("following", "name avatar bio"),
    Follow.countDocuments({ follower: userId }),
  ]);

  const users = follows.map((f) => f.following.toJSON());
  const enriched = await attachIsFollowing(users, currentUserId);
  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    users: enriched,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasMore: pageNum < totalPages,
    },
  };
};
