import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import Post from "../models/Post.js";
import Follow from "../models/Follow.js";

const attachIsFollowingUsers = async (users, currentUserId) => {
  if (!currentUserId || users.length === 0)
    return users.map((u) => ({ ...u, isFollowing: false }));
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

export const getMyFullProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const [postCount, followersCount, followingCount] = await Promise.all([
    Post.countDocuments({ author: userId }),
    Follow.countDocuments({ following: userId }),
    Follow.countDocuments({ follower: userId }),
  ]);

  return {
    ...user.toJSON(),
    postCount,
    followersCount,
    followingCount,
  };
};

export const getPublicProfile = async (id, currentUserId) => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  const [postCount, followersCount, followingCount, isFollowing] =
    await Promise.all([
      Post.countDocuments({ author: id }),
      Follow.countDocuments({ following: id }),
      Follow.countDocuments({ follower: id }),
      currentUserId
        ? Follow.exists({ follower: currentUserId, following: id })
        : false,
    ]);

  return {
    id: user._id,
    name: user.name,
    avatar: user.avatar,
    bio: user.bio,
    createdAt: user.createdAt,
    postCount,
    followersCount,
    followingCount,
    isFollowing: Boolean(isFollowing),
  };
};

export const updateMyProfile = async (userId, updates) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  if (updates.name !== undefined) user.name = updates.name;
  if (updates.bio !== undefined) user.bio = updates.bio;
  if (updates.avatar !== undefined) user.avatar = updates.avatar;

  await user.save();
  return user;
};

export const searchUsers = async (query, { page, limit }, currentUserId) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = query ? { name: { $regex: query.trim(), $options: "i" } } : {};

  const [users, total] = await Promise.all([
    User.find(filter).sort({ name: 1 }).skip(skip).limit(limitNum),
    User.countDocuments(filter),
  ]);

  const plain = users.map((u) => ({
    id: u._id,
    name: u.name,
    avatar: u.avatar,
    bio: u.bio,
  }));
  const enriched = await attachIsFollowingUsers(plain, currentUserId);

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
