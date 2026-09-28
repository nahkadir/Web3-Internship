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

export const loginUser = async ({ email, password }) => {
  // password is select:false, so request it explicitly
  const user = await User.findOne({ email }).select("+password");

  // Same message for "no user" and "wrong password" so emails can't be probed
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  return user; // toJSON strips the password when sent in a response
};
