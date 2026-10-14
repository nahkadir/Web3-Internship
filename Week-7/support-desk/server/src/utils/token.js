import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signToken = (id) =>
  jwt.sign({ id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

// keep maxAge in sync with JWT_EXPIRES_IN (7d)
export const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
