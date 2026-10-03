import { asyncHandler } from "../utils/asyncHandler.js";
import * as feedService from "../services/feed.service.js";

export const getPersonalizedFeed = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { posts, pagination } = await feedService.getPersonalizedFeed(
    req.user._id,
    { page, limit },
  );
  res.status(200).json({ posts, pagination });
});
