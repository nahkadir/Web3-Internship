import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { ROLES } from "../constants/roles.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export const signToken = (userId) =>
  jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: "7d" });

export const registerUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError("Email is already registered", 409);

  const hashed = await bcrypt.hash(password, 12);
  // role is hardcoded: nobody can self-register as VENDOR or ADMIN
  return User.create({ name, email, password: hashed, role: ROLES.CUSTOMER });
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  // same message for "no user" and "wrong password" so attackers can't probe emails
  const valid = user && (await bcrypt.compare(password, user.password));
  if (!valid) throw new AppError("Invalid email or password", 401);

  return { user, token: signToken(user._id) };
};
