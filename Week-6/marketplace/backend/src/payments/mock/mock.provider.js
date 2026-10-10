import { MockTransaction } from "./MockTransaction.js";
import { rid } from "../ids.js";
import { verifySignature } from "../signature.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";

const toView = (tx) => {
  let status = tx.status;
  let failureReason = tx.failureReason;
  if (status === "pending" && tx.expiresAt && tx.expiresAt < new Date()) {
    status = "cancelled";
    failureReason = "Payment session expired";
  }
  return {
    transactionId: tx.transactionId,
    status,
    amount: tx.amount,
    currency: tx.currency,
    metadata: tx.toObject().metadata,
    failureReason,
  };
};

export const mockProvider = {
  name: "mock",

  sessionUrl: (transactionId) => `${env.frontendUrl}/pay/mock/${transactionId}`,

  async createSession({
    amount,
    currency,
    metadata,
    successUrl,
    cancelUrl,
    expiresAt,
  }) {
    const tx = await MockTransaction.create({
      transactionId: rid("txn"),
      amount,
      currency,
      metadata,
      successUrl,
      cancelUrl,
      expiresAt,
    });
    return {
      transactionId: tx.transactionId,
      redirectUrl: mockProvider.sessionUrl(tx.transactionId),
    };
  },

  async retrieveTransaction(transactionId) {
    const tx = await MockTransaction.findOne({ transactionId });
    if (!tx)
      throw new AppError("Transaction not found at the payment provider", 404);
    return toView(tx);
  },

  async refund({ transactionId, amount, reason }) {
    const refundId = rid("re");
    const tx = await MockTransaction.findOneAndUpdate(
      { transactionId, status: "succeeded" },
      {
        $set: { status: "refunded" },
        $push: { refunds: { refundId, amount, reason, createdAt: new Date() } },
      },
      { new: true },
    );
    if (!tx)
      throw new AppError(
        "The payment provider cannot refund this transaction",
        409,
      );
    return { refundId, status: "succeeded" };
  },

  // checks the signature, then returns the parsed event
  parseWebhook(rawBody, signatureHeader) {
    if (!verifySignature(rawBody, signatureHeader, env.payment.webhookSecret)) {
      throw new AppError("Invalid webhook signature", 400);
    }
    let event;
    try {
      event = JSON.parse(rawBody.toString("utf8"));
    } catch {
      throw new AppError("Invalid webhook payload", 400);
    }
    if (!event?.id || !event?.type || !event?.data?.transactionId) {
      throw new AppError("Invalid webhook payload", 400);
    }
    return event;
  },
};
