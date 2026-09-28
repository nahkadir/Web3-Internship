import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

export const registerUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "Email is already registered", [
      { field: "email", message: "Email is already registered" },
    ]);
  }

  // Password is hashed by the pre("save") hook in the User model
  const user = await User.create({ name, email, password });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
};
