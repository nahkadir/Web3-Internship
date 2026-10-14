import { asyncHandler } from "../utils/asyncHandler.js";
import { signToken, cookieOptions } from "../utils/token.js";
import * as authService from "../services/auth.service.js";

const sendAuthResponse = (res, user, statusCode) => {
  res.cookie("token", signToken(user._id), cookieOptions);
  res.status(statusCode).json({ success: true, data: { user } });
};

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  sendAuthResponse(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const user = await authService.loginUser(req.body);
  sendAuthResponse(res, user, 200);
});

export const logout = asyncHandler(async (req, res) => {
  const { maxAge, ...options } = cookieOptions;
  res.clearCookie("token", options);
  res.json({ success: true, message: "Logged out successfully" });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});
