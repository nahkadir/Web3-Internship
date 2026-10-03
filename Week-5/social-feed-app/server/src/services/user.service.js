import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import Post from "../models/Post.js";
import Follow from "../models/Follow.js";

export const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");
  return user;
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
