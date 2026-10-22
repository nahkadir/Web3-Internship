import { Router } from "express";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { runSlaSweep } from "../services/sla.service.js";

const router = Router();

router.get(
  "/sla-sweep",
  asyncHandler(async (req, res) => {
    if (
      !env.cronSecret ||
      req.headers.authorization !== `Bearer ${env.cronSecret}`
    ) {
      throw new ApiError(401, "Unauthorized");
    }
    res.json({ success: true, data: await runSlaSweep() });
  }),
);

export default router;
