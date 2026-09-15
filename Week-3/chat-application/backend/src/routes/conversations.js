import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createOrFindConversation } from "../controllers/conversations.js";

const router = express.Router();

router.post("/", protect, createOrFindConversation);

export default router;
