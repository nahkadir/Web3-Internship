import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const limiter = (windowMs, limit, message, keyGenerator) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => env.nodeEnv === "test",
    message: { success: false, message },
    ...(keyGenerator && { keyGenerator }),
  });

const byUser = (req) => String(req.user._id); // only used after `protect`

export const apiLimiter = limiter(
  60_000,
  300,
  "Too many requests. Please slow down",
);
export const authLimiter = limiter(
  15 * 60_000,
  20,
  "Too many attempts. Try again in 15 minutes",
);
export const ticketCreateLimiter = limiter(
  60 * 60_000,
  20,
  "You are creating tickets too quickly. Try again later",
  byUser,
);
export const messageLimiter = limiter(
  60_000,
  30,
  "You are sending messages too quickly",
  byUser,
);
