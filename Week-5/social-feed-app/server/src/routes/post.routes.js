import { Router } from "express";
import { createPost, getFeed } from "../controllers/post.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createPostSchema } from "../validators/post.schema.js";

const router = Router();

router.post("/", protect, validate(createPostSchema), createPost);
router.get("/", getFeed);

export default router;
