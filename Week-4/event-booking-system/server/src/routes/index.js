import { Router } from "express";
import healthRoutes from "./health.route.js";
import authRoutes from "./auth.route.js";
import eventRoutes from "./event.route.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/events", eventRoutes);

export default router;
