import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signToken = (id) =>
  jwt.sign({ id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: env.nodeEnv === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const signSocketToken = (id) =>
  jwt.sign({ id, purpose: "socket" }, env.jwtSecret, { expiresIn: "2m" });
