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
