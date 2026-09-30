import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { COOKIE_NAME } from "../utils/token.js";

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id);
    if (user) req.user = user;
  } catch {
    // invalid/expired token on a public route — just treat as logged out
  }
  next();
});
