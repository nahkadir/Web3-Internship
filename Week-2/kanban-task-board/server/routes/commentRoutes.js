import express from "express";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/tasks/:id/comments", protect, getComments);
router.post("/tasks/:id/comments", protect, createComment);
router.put("/comments/:id", protect, updateComment);
router.delete("/comments/:id", protect, deleteComment);

export default router;
