import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

export const registerUser = async ({ name, email, password }) => {
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, "Email is already registered");
  // role is never taken from the request: new users are always CUSTOMER
  return User.create({ name, email, password });
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  // same message for both cases so attackers can't tell which emails exist
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (!user.isActive)
    throw new ApiError(403, "Your account has been deactivated");
  return user;
};
