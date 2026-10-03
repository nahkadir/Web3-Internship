import { Router } from "express";
import {
  getMyProfile,
  getPublicProfile,
  updateMyProfile,
  searchUsers,
} from "../controllers/user.controller.js";

import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from "../controllers/follow.controller.js";
import { protect } from "../middleware/auth.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema } from "../validators/user.schema.js";

const router = Router();

router.get("/me", protect, getMyProfile);
router.patch("/me", protect, validate(updateProfileSchema), updateMyProfile);

router.post("/:id/follow", protect, followUser);
router.delete("/:id/follow", protect, unfollowUser);
router.get("/:id/followers", optionalAuth, getFollowers);
router.get("/:id/following", optionalAuth, getFollowing);

router.get("/:id", optionalAuth, getPublicProfile);
router.get("/", optionalAuth, searchUsers);

export default router;
