import { Router } from "express";
import { getPersonalizedFeed } from "../controllers/feed.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, getPersonalizedFeed);

export default router;
