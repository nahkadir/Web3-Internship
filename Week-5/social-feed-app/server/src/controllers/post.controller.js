import { asyncHandler } from "../utils/asyncHandler.js";
import * as postService from "../services/post.service.js";

export const createPost = asyncHandler(async (req, res) => {
  const post = await postService.createPost(req.user._id, req.body);
  res.status(201).json({ message: "Post created", post });
});
