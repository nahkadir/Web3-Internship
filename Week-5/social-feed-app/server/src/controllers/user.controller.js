import { asyncHandler } from "../utils/asyncHandler.js";
import * as userService from "../services/user.service.js";

export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user._id);
  res.status(200).json({ user });
});

export const getPublicProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getPublicProfile(
    req.params.id,
    req.user?._id,
  );
  res.status(200).json({ user: profile });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateMyProfile(req.user._id, req.body);
  res.status(200).json({ message: "Profile updated", user });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const { search, page, limit } = req.query;
  const { users, pagination } = await userService.searchUsers(
    search,
    { page, limit },
    req.user?._id,
  );
  res.status(200).json({ users, pagination });
});
