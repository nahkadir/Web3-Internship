import { Router } from "express";
import {
  getMyProfile,
  getPublicProfile,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.js";
import { optionalAuth } from "../middleware/optionalAuth.js";

const router = Router();

router.get("/me", protect, getMyProfile);
router.get("/:id", optionalAuth, getPublicProfile);

export default router;
