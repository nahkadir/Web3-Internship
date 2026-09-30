import { asyncHandler } from "../utils/asyncHandler.js";
import * as commentService from "../services/comment.service.js";

export const createComment = asyncHandler(async (req, res) => {
  const comment = await commentService.createComment(
    req.params.id,
    req.user._id,
    req.body,
  );
  res.status(201).json({ message: "Comment added", comment });
});

export const getPostComments = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { comments, pagination } = await commentService.getPostComments(
    req.params.id,
    { page, limit },
  );
  res.status(200).json({ comments, pagination });
});

export const updateComment = asyncHandler(async (req, res) => {
  const comment = await commentService.updateComment(
    req.params.id,
    req.user._id,
    req.body,
  );
  res.status(200).json({ message: "Comment updated", comment });
});

export const deleteComment = asyncHandler(async (req, res) => {
  await commentService.deleteComment(req.params.id, req.user._id);
  res.status(200).json({ message: "Comment deleted successfully" });
});
