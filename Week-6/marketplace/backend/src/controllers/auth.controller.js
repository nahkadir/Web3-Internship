import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { registerUser, loginUser } from "../services/auth.service.js";

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);
  res
    .status(201)
    .json({ success: true, message: "Registered successfully", user });
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await loginUser(req.body);
  res.cookie("token", token, cookieOptions);
  res.json({ success: true, message: "Logged in successfully", user });
});

export const logout = (req, res) => {
  res.clearCookie("token", { ...cookieOptions, maxAge: undefined });
  res.json({ success: true, message: "Logged out successfully" });
};

export const me = (req, res) => {
  res.json({ success: true, user: req.user });
};
