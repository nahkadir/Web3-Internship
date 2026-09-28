import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/auth.service.js";
import {
  signToken,
  cookieOptions,
  clearCookieOptions,
  COOKIE_NAME,
} from "../utils/token.js";

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);

  res.status(201).json({
    message: "Registration successful",
    user,
  });
});

export const login = asyncHandler(async (req, res) => {
  const user = await authService.loginUser(req.body);

  const token = signToken(user._id);
  res.cookie(COOKIE_NAME, token, cookieOptions);

  res.status(200).json({
    message: "Login successful",
    user,
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(COOKIE_NAME, clearCookieOptions);
  res.status(200).json({ message: "Logout successful" });
});

// Controller: reads req, calls the service, sends res.
// Service: business rules and DB access. It knows nothing about req/res.
