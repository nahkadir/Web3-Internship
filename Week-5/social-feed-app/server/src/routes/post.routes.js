import { Router } from "express";
import {
  createPost,
  getFeed,
  getPost,
  updatePost,
  deletePost,
} from "../controllers/post.controller.js";
import {
  updatePostSchema,
  createPostSchema,
} from "../validators/post.schema.js";
import { createCommentSchema } from "../validators/comment.schema.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { likePost, unlikePost } from "../controllers/like.controller.js";
import {
  createComment,
  getPostComments,
} from "../controllers/comment.controller.js";
import { optionalAuth } from "../middleware/optionalAuth.js";

const router = Router();

router.post("/", protect, validate(createPostSchema), createPost);
router.get("/", optionalAuth, getFeed);
router.get("/:id", optionalAuth, getPost);
router.patch("/:id", protect, validate(updatePostSchema), updatePost);
router.delete("/:id", protect, deletePost);

router.post("/:id/like", protect, likePost);
router.delete("/:id/like", protect, unlikePost);

router.post(
  "/:id/comments",
  protect,
  validate(createCommentSchema),
  createComment,
);
router.get("/:id/comments", getPostComments);

export default router;
