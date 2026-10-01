import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import Post from "../models/Post.js";

export const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

export const getPublicProfile = async (id, currentUserId) => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  const postCount = await Post.countDocuments({ author: id });

  return {
    id: user._id,
    name: user.name,
    avatar: user.avatar,
    bio: user.bio,
    createdAt: user.createdAt,
    postCount,
    followersCount: 0,
    followingCount: 0,
    isFollowing: false,
  };
};
