import { asyncHandler } from "../utils/asyncHandler.js";
import * as userService from "../services/user.service.js";

export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user._id);
  res.status(200).json({ user });
});
