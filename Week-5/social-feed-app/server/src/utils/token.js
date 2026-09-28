import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const COOKIE_NAME = "token";

export const signToken = (userId) =>
  jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

// Keep maxAge in sync with JWT_EXPIRES_IN (7d = 7 days)
export const cookieOptions = {
  httpOnly: true, // JS in the browser cannot read it
  secure: env.nodeEnv === "production",
  sameSite: env.nodeEnv === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const { maxAge, ...clearCookieOptions } = cookieOptions;
export { clearCookieOptions };

// JWT    = the authentication token
// Cookie = a mechanism for storing/sending that token in the browser
