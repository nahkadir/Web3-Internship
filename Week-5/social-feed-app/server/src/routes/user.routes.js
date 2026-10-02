import { Router } from "express";
import {
  getMyProfile,
  getPublicProfile,
  updateMyProfile,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema } from "../validators/user.schema.js";

const router = Router();

router.get("/me", protect, getMyProfile);
router.patch("/me", protect, validate(updateProfileSchema), updateMyProfile);
router.get("/:id", optionalAuth, getPublicProfile);

export default router;
