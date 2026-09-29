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
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.post("/", protect, validate(createPostSchema), createPost);
router.get("/", getFeed);
router.get("/:id", getPost);
router.patch("/:id", protect, validate(updatePostSchema), updatePost);
router.delete("/:id", protect, deletePost);

export default router;
