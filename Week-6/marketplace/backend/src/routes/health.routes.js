import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (req, res) => {
  const database =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  res.status(database === "connected" ? 200 : 503).json({
    success: true,
    status: "ok",
    database,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
