import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    success: dbUp,
    status: dbUp ? "ok" : "degraded",
    uptime: Math.round(process.uptime()),
    db: dbUp ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

export default router;
