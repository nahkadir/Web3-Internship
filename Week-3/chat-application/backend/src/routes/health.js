import express from "express";
// a quick test endpoint to check whether your backend server is alive and responding

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check if the server is running
 *     responses:
 *       200:
 *         description: Server is healthy
 */

router.get("/", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
