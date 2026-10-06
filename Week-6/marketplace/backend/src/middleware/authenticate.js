import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.token;

  const header = req.headers.authorization;
  if (!token && header?.startsWith("Bearer ")) token = header.split(" ")[1];

  if (!token) throw new AppError("Authentication required", 401);

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    throw new AppError(
      err.name === "TokenExpiredError"
        ? "Session expired, please log in again"
        : "Invalid token",
      401,
    );
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new AppError("User no longer exists", 401);

  req.user = user; // role comes from the DB, never from the client
  next();
});
