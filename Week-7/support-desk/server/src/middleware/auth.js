import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) throw new ApiError(401, "Not authenticated. Please log in");

  const decoded = jwt.verify(token, env.jwtSecret); // errors handled by errorHandler -> 401
  if (decoded.purpose) throw new ApiError(401, "Invalid token");
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive)
    throw new ApiError(401, "User no longer exists or is inactive");

  req.user = user;
  next();
});
