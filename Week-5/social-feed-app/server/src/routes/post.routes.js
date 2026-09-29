import { Router } from "express";
import {
  createPost,
  getFeed,
  getPost,
} from "../controllers/post.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createPostSchema } from "../validators/post.schema.js";

const router = Router();

router.post("/", protect, validate(createPostSchema), createPost);
router.get("/", getFeed);
router.get("/:id", getPost);

export default router;
