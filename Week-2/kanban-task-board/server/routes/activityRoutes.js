import express from "express";
import { getActivity } from "../controllers/activityController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/tasks/:id/activity", protect, getActivity);

export default router;
