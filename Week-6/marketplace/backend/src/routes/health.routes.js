import { Router } from "express";
import mongoose from "mongoose";
import { env } from "../config/env.js";

const router = Router();

router.get("/", (req, res) => {
  const database =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  res.status(database === "connected" ? 200 : 503).json({
    success: true,
    status: "ok",
    database,
    environment: env.nodeEnv,
    commit: (
      process.env.RENDER_GIT_COMMIT ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      "dev"
    ).slice(0, 7),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
