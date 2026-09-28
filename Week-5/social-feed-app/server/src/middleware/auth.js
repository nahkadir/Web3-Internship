import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { COOKIE_NAME, clearCookieOptions } from "../utils/token.js";

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    throw new ApiError(401, "Not authenticated. Please log in.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    res.clearCookie(COOKIE_NAME, clearCookieOptions); // drop the dead cookie
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Session expired. Please log in again.");
    }
    throw new ApiError(401, "Invalid token. Please log in again.");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.clearCookie(COOKIE_NAME, clearCookieOptions);
    throw new ApiError(401, "User no longer exists. Please log in again.");
  }

  req.user = user;
  next();
});
