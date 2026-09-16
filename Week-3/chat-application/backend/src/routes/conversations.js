import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createOrFindConversation } from "../controllers/conversationController.js";
import { getMessages } from "../controllers/messageController.js";

const router = express.Router();

router.post("/", protect, createOrFindConversation);
router.get("/:conversationId/messages", protect, getMessages);

export default router;
