import { Router } from "express";
import {
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { updateCommentSchema } from "../validators/comment.schema.js";

const router = Router();

router.patch("/:id", protect, validate(updateCommentSchema), updateComment);
router.delete("/:id", protect, deleteComment);

export default router;
