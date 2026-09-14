import express from "express";
import { getProfile, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getProfile);
router.patch("/me", protect, updateProfile);

export default router;
