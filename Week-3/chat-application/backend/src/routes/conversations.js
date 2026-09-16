import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createOrFindConversation,
  listConversations,
} from "../controllers/conversationController.js";
import { getMessages } from "../controllers/messageController.js";

const router = express.Router();

router.post("/", protect, createOrFindConversation);
router.get("/:conversationId/messages", protect, getMessages);
router.get("/", protect, listConversations);

export default router;
