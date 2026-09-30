import { asyncHandler } from "../utils/asyncHandler.js";
import * as likeService from "../services/like.service.js";

export const likePost = asyncHandler(async (req, res) => {
  const stats = await likeService.likePost(req.params.id, req.user._id);
  res.status(200).json(stats);
});

export const unlikePost = asyncHandler(async (req, res) => {
  const stats = await likeService.unlikePost(req.params.id, req.user._id);
  res.status(200).json(stats);
});
