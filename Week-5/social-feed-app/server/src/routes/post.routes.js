import { Router } from "express";
import { createPost } from "../controllers/post.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createPostSchema } from "../validators/post.schema.js";

const router = Router();

router.post("/", protect, validate(createPostSchema), createPost);

export default router;
