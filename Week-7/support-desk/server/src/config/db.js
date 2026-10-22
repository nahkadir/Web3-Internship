import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let connecting = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  connecting ??= mongoose.connect(env.mongoUri);
  try {
    await connecting;
  } catch (err) {
    connecting = null;
    throw err;
  }
  logger.info(`MongoDB connected: ${mongoose.connection.host}`);
};
