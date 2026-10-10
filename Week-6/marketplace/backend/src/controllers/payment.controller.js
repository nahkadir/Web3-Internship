import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { getProvider } from "../payments/index.js";
import { paymentLog } from "../utils/paymentLog.js";
import * as paymentService from "../services/payment.service.js";

export const create = asyncHandler(async (req, res) => {
  const result = await paymentService.createPayment(req.user, req.body.orderId);
  res.status(201).json({ success: true, ...result });
});

export const verify = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    ...(await paymentService.verifyPayment(req.user, req.body.orderId)),
  });
});

// public URL, but only requests carrying a valid provider signature are accepted
export const webhook = asyncHandler(async (req, res) => {
  if (!Buffer.isBuffer(req.body))
    throw new AppError("Invalid webhook payload", 400);

  let event;
  try {
    event = getProvider().parseWebhook(req.body, req.headers["x-signature"]);
  } catch (err) {
    paymentLog("webhook.invalid", { reason: err.message });
    throw err;
  }

  const result = await paymentService.handleWebhookEvent(event);
  res.json({ received: true, ...result });
});
