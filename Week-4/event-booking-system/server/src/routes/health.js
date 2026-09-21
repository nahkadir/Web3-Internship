import { Router } from "express";
import { sendSuccess } from "../utils/apiResponse.js";

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */

router.get("/", (req, res) =>
  sendSuccess(res, {
    message: "API is healthy",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  }),
);

export default router;
