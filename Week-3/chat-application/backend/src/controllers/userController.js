import { getUserProfile, updateUserProfile } from "../services/userService.js";

export const getProfile = async (req, res, next) => {
  try {
    const user = await getUserProfile(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await updateUserProfile(req.user._id, req.body);
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
