import express from "express";
import { getProfile, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { listUsers } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", protect, getProfile);
router.patch("/me", protect, updateProfile);
router.get("/", protect, listUsers);

export default router;
