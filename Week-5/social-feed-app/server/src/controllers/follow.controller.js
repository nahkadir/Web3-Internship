import { asyncHandler } from "../utils/asyncHandler.js";
import * as followService from "../services/follow.service.js";

export const followUser = asyncHandler(async (req, res) => {
  const result = await followService.followUser(req.params.id, req.user._id);
  res.status(200).json(result);
});

export const unfollowUser = asyncHandler(async (req, res) => {
  const result = await followService.unfollowUser(req.params.id, req.user._id);
  res.status(200).json(result);
});

export const getFollowers = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { users, pagination } = await followService.getFollowers(
    req.params.id,
    { page, limit },
    req.user?._id,
  );
  res.status(200).json({ users, pagination });
});

export const getFollowing = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { users, pagination } = await followService.getFollowing(
    req.params.id,
    { page, limit },
    req.user?._id,
  );
  res.status(200).json({ users, pagination });
});
