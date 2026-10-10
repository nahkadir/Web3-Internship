import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middleware/validate.js";
import {
  getHostedSession,
  completeSession,
  replayWebhook,
} from "./mockGateway.js";

const router = Router();

const params = z.object({
  txnId: z.string().regex(/^txn_[a-f0-9]{24}$/, "Invalid transaction id"),
});
const paramsSchema = z.object({ params });
const completeSchema = z.object({
  params,
  body: z.object({ outcome: z.enum(["succeed", "fail", "cancel"]) }),
});

router.get(
  "/:txnId",
  validate(paramsSchema),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      session: await getHostedSession(req.params.txnId),
    });
  }),
);

router.post(
  "/:txnId/complete",
  validate(completeSchema),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      ...(await completeSession(req.params.txnId, req.body.outcome)),
    });
  }),
);

router.post(
  "/:txnId/replay-webhook",
  validate(paramsSchema),
  asyncHandler(async (req, res) => {
    res.json({ success: true, ...(await replayWebhook(req.params.txnId)) });
  }),
);

export default router;
