import { asyncHandler } from "../utils/asyncHandler.js";
import * as postService from "../services/post.service.js";

export const createPost = asyncHandler(async (req, res) => {
  const post = await postService.createPost(req.user._id, req.body);
  res.status(201).json({ message: "Post created", post });
});

export const getFeed = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { posts, pagination } = await postService.getFeed({ page, limit });
  res.status(200).json({ posts, pagination });
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await postService.getPostById(req.params.id);
  res.status(200).json({ post });
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await postService.updatePost(
    req.params.id,
    req.user._id,
    req.body,
  );
  res.status(200).json({ message: "Post updated", post });
});

export const deletePost = asyncHandler(async (req, res) => {
  await postService.deletePost(req.params.id, req.user._id);
  res.status(200).json({ message: "Post deleted successfully" });
});
