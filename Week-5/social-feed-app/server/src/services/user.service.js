import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

export const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");
  return user;
};
