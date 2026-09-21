import { Router } from "express";
import { z } from "zod";
import healthRoutes from "./health.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { sendSuccess } from "../utils/apiResponse.js";

const router = Router();

router.use("/health", healthRoutes);

export default router;
