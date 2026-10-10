import { MockTransaction } from "./MockTransaction.js";
import { rid } from "../ids.js";
import { signPayload } from "../signature.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import { paymentLog } from "../../utils/paymentLog.js";

const OUTCOMES = {
  succeed: { status: "succeeded", eventType: "payment.succeeded" },
  fail: { status: "failed", eventType: "payment.failed" },
  cancel: { status: "cancelled", eventType: "payment.cancelled" },
};

// server-to-server call, like a real provider notifying us
const sendWebhook = async (tx, type, eventId) => {
  const event = {
    id: eventId,
    type,
    created: Math.floor(Date.now() / 1000),
    data: {
      transactionId: tx.transactionId,
      amount: tx.amount,
      currency: tx.currency,
      metadata: tx.toObject().metadata,
      failureReason: tx.failureReason,
    },
  };
  const body = JSON.stringify(event);

  try {
    await fetch(`${env.backendUrl}/api/payments/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": signPayload(body, env.payment.webhookSecret),
      },
      body,
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    paymentLog("mock.webhook_delivery_failed", {
      transactionId: tx.transactionId,
      error: err.message,
    });
  }
};

export const getHostedSession = async (transactionId) => {
  const tx = await MockTransaction.findOne({ transactionId });
  if (!tx) throw new AppError("Payment session not found", 404);

  const expired = tx.status === "pending" && tx.expiresAt < new Date();
  return {
    transactionId,
    status: expired ? "expired" : tx.status,
    amount: tx.amount / 100,
    currency: tx.currency,
    orderNumber: tx.metadata?.orderNumber,
    expiresAt: tx.expiresAt,
  };
};

// the customer clicked a button on the hosted page
export const completeSession = async (transactionId, outcome) => {
  const { status, eventType } = OUTCOMES[outcome];
  const eventId = rid("evt");

  const update = { status, lastEvent: { id: eventId, type: eventType } };
  if (outcome === "fail") update.failureReason = "Card declined (test mode)";
  if (outcome === "cancel") update.failureReason = "Cancelled by the customer";

  const tx = await MockTransaction.findOneAndUpdate(
    { transactionId, status: "pending", expiresAt: { $gt: new Date() } },
    update,
    { new: true },
  );
  if (!tx) throw new AppError("This payment session is no longer active", 409);

  await sendWebhook(tx, eventType, eventId);
  return {
    status,
    redirectUrl: outcome === "succeed" ? tx.successUrl : tx.cancelUrl,
  };
};

// dev helper: re-deliver the SAME event (same id) to prove webhook idempotency
export const replayWebhook = async (transactionId) => {
  const tx = await MockTransaction.findOne({ transactionId });
  if (!tx?.lastEvent?.id)
    throw new AppError("No webhook has been sent for this session yet", 409);
  await sendWebhook(tx, tx.lastEvent.type, tx.lastEvent.id);
  return { replayed: tx.lastEvent.id };
};
