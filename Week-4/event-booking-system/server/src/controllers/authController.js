import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { registerUser, loginUser } from "../services/authService.js";

export const register = asyncHandler(async (req, res) => {
  const data = await registerUser(req.body);
  sendSuccess(res, {
    statusCode: 201,
    message: "User registered successfully",
    data,
  });
});

export const login = asyncHandler(async (req, res) => {
  const data = await loginUser(req.body);
  sendSuccess(res, { message: "Login successful", data });
});
