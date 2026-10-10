import { Payment } from "../models/Payment.js";
import { Order } from "../models/Order.js";
import { OrderItem } from "../models/OrderItem.js";
import { WebhookEvent } from "../models/WebhookEvent.js";
import { getProvider } from "../payments/index.js";
import { env } from "../config/env.js";
import { ORDER_STATUS, PAYMENT_STATUS } from "../constants/statuses.js";
import { AppError } from "../utils/AppError.js";
import { paymentLog } from "../utils/paymentLog.js";
import { calculateTotals, toMinorUnits } from "./pricing.service.js";
import { createCommissionsForOrder } from "./commission.service.js";
import {
  cancelUnpaidOrder,
  isOrderExpired,
  paymentDeadline,
} from "./orderLifecycle.service.js";

const { PENDING, PROCESSING, PAID, FAILED, CANCELLED, REFUNDED } =
  PAYMENT_STATUS;
const OPEN = [PENDING, PROCESSING];

/* ---------- what the frontend is allowed to see ---------- */

export const toClientPayment = (p) =>
  p && {
    id: p.id,
    orderId: p.orderId,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    paymentMethod: p.paymentMethod,
    transactionId: p.transactionId,
    paidAt: p.paidAt,
    expiresAt: p.expiresAt,
    failureReason: p.failureReason,
  };

const orderSummary = (o) => ({
  id: o.id,
  orderNumber: o.orderNumber,
  status: o.status,
  paymentStatus: o.paymentStatus,
  totalAmount: o.totalAmount,
  paymentDeadline: paymentDeadline(o),
});

/* ---------- state changes (each one is an atomic "claim", so only one caller wins) ---------- */

const markPaid = async (payment) => {
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $in: OPEN } },
    {
      $set: { status: PAID, active: true, paidAt: new Date() },
      $unset: { failureReason: "" },
    },
    { new: true },
  );
  if (!claimed) return Payment.findById(payment._id); // already handled by the webhook / verify / a retry

  paymentLog("payment.paid", {
    paymentId: claimed.id,
    orderId: String(claimed.orderId),
    transactionId: claimed.transactionId,
  });

  await Order.updateOne({ _id: claimed.orderId }, { paymentStatus: PAID });
  const order = await Order.findById(claimed.orderId);

  if (order.status === ORDER_STATUS.CANCELLED) {
    // the customer paid just as the order expired: keep the record, an admin must refund it
    paymentLog("payment.paid_on_cancelled_order", {
      paymentId: claimed.id,
      orderId: order.id,
    });
    return claimed;
  }

  if (order.status === ORDER_STATUS.PENDING) {
    await Order.updateOne(
      { _id: order._id, status: ORDER_STATUS.PENDING },
      { status: ORDER_STATUS.CONFIRMED },
    );
    await OrderItem.updateMany(
      { orderId: order._id, status: ORDER_STATUS.PENDING },
      { status: ORDER_STATUS.CONFIRMED },
    );
  }
  await createCommissionsForOrder(order._id);
  return claimed;
};

const markEnded = async (payment, status, reason) => {
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $in: OPEN } },
    {
      status,
      active: false,
      failureReason: reason || "Payment was not completed",
    },
    { new: true },
  );
  if (!claimed) return Payment.findById(payment._id);

  // a failed/cancelled payment never confirms the order; it stays PENDING so the customer can retry
  await Order.updateOne(
    {
      _id: claimed.orderId,
      paymentStatus: { $in: ["UNPAID", PENDING, PROCESSING] },
    },
    { paymentStatus: status },
  );
  paymentLog(`payment.${status.toLowerCase()}`, {
    paymentId: claimed.id,
    orderId: String(claimed.orderId),
  });
  return claimed;
};

/* ---------- shared by verify and webhook ---------- */

export const applyProviderResult = async (payment, tx) => {
  // 1. the transaction must be the one WE created for THIS payment and order
  if (
    tx.transactionId !== payment.transactionId ||
    tx.metadata?.paymentId !== payment.id ||
    tx.metadata?.orderId !== String(payment.orderId)
  ) {
    paymentLog("payment.ownership_mismatch", {
      paymentId: payment.id,
      transactionId: tx.transactionId,
    });
    throw new AppError("Transaction does not belong to this order", 409);
  }

  // 2. the amount actually charged must equal what we asked for
  if (
    tx.amount !== toMinorUnits(payment.amount) ||
    tx.currency !== payment.currency
  ) {
    paymentLog("payment.amount_mismatch", {
      paymentId: payment.id,
      transactionId: tx.transactionId,
    });
    throw new AppError("Payment amount does not match the order", 409);
  }

  switch (tx.status) {
    case "succeeded":
      return markPaid(payment);
    case "failed":
      return markEnded(payment, FAILED, tx.failureReason);
    case "cancelled":
      return markEnded(payment, CANCELLED, tx.failureReason);
    case "processing":
      await Payment.updateOne(
        { _id: payment._id, status: PENDING },
        { status: PROCESSING },
      );
      return Payment.findById(payment._id);
    default:
      return payment; // still pending at the provider
  }
};

/* ---------- Task 3: create payment ---------- */

export const createPayment = async (user, orderId) => {
  const provider = getProvider();

  const order = await Order.findOne({ _id: orderId, userId: user._id }); // only the order's owner
  if (!order) throw new AppError("Order not found", 404);
  if (order.status === ORDER_STATUS.CANCELLED)
    throw new AppError("This order has been cancelled", 409);
  if (order.paymentStatus === PAID)
    throw new AppError("This order is already paid", 409);
  if (order.paymentStatus === REFUNDED)
    throw new AppError("This order has been refunded", 409);

  if (isOrderExpired(order)) {
    await cancelUnpaidOrder(order, "Payment window expired");
    throw new AppError(
      "This order expired because payment was not completed in time",
      410,
    );
  }

  // the amount comes from the stored order, re-checked against its items. Never from the client.
  const items = await OrderItem.find({ orderId: order._id });
  const recalculated = calculateTotals(
    items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
  );
  if (recalculated.totalAmount !== order.totalAmount) {
    paymentLog("order.total_mismatch", { orderId: order.id });
    throw new AppError("The order total could not be verified", 409);
  }

  // reuse a live session instead of creating a second one
  const live = await Payment.findOne({ orderId: order._id, active: true });
  if (live) {
    if (live.status === PAID)
      throw new AppError("This order is already paid", 409);
    if (live.transactionId && live.expiresAt > new Date()) {
      return {
        payment: toClientPayment(live),
        redirectUrl: provider.sessionUrl(live.transactionId),
      };
    }
    await Payment.updateOne(
      { _id: live._id, status: { $in: OPEN } },
      {
        status: CANCELLED,
        active: false,
        failureReason: "Payment session expired",
      },
    );
  }

  let payment;
  try {
    payment = await Payment.create({
      orderId: order._id,
      userId: user._id,
      amount: order.totalAmount,
      currency: env.payment.currency,
      provider: provider.name,
      status: PENDING,
      expiresAt: paymentDeadline(order),
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(
        "A payment is already being set up for this order. Please try again.",
        409,
      );
    }
    throw err;
  }

  try {
    const session = await provider.createSession({
      amount: toMinorUnits(payment.amount),
      currency: payment.currency,
      metadata: {
        paymentId: payment.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      successUrl: `${env.frontendUrl}/orders/${order.id}/payment?result=success`,
      cancelUrl: `${env.frontendUrl}/orders/${order.id}/payment?result=cancelled`,
      expiresAt: payment.expiresAt,
    });

    payment.transactionId = session.transactionId;
    await payment.save();
    await Order.updateOne(
      { _id: order._id, paymentStatus: { $ne: PAID } },
      { paymentStatus: PENDING },
    );

    paymentLog("payment.created", {
      paymentId: payment.id,
      orderId: order.id,
      provider: provider.name,
    });
    return {
      payment: toClientPayment(payment),
      redirectUrl: session.redirectUrl,
    };
  } catch (err) {
    await Payment.deleteOne({ _id: payment._id });
    paymentLog("payment.session_failed", {
      orderId: order.id,
      error: err.message,
    });
    throw new AppError(
      "The payment provider is unavailable. Please try again.",
      502,
    );
  }
};

/* ---------- Task 4: verify (asks the provider, never trusts the browser) ---------- */

export const verifyPayment = async (user, orderId) => {
  const order = await Order.findOne({ _id: orderId, userId: user._id });
  if (!order) throw new AppError("Order not found", 404);

  let payment = await Payment.findOne({ orderId: order._id }).sort({
    createdAt: -1,
  });

  if (payment && OPEN.includes(payment.status) && payment.transactionId) {
    const tx = await getProvider().retrieveTransaction(payment.transactionId);
    payment = await applyProviderResult(payment, tx);

    if (OPEN.includes(payment.status) && payment.expiresAt < new Date()) {
      payment = await markEnded(payment, CANCELLED, "Payment session expired");
    }
  }

  const fresh = await Order.findById(order._id);
  return { payment: toClientPayment(payment), order: orderSummary(fresh) };
};

/* ---------- Task 5: webhook ---------- */

const EVENT_STATUS = {
  "payment.succeeded": "succeeded",
  "payment.failed": "failed",
  "payment.cancelled": "cancelled",
};

export const handleWebhookEvent = async (event) => {
  const status = EVENT_STATUS[event.type];
  if (!status) return { ignored: true }; // an event type we do not act on

  // idempotency: an event id is processed only once
  try {
    await WebhookEvent.create({ eventId: event.id, type: event.type });
  } catch (err) {
    if (err.code === 11000) {
      paymentLog("webhook.duplicate", { eventId: event.id });
      return { duplicate: true };
    }
    throw err;
  }

  try {
    const payment = await Payment.findOne({
      transactionId: event.data.transactionId,
    });
    if (!payment) {
      paymentLog("webhook.unknown_transaction", { eventId: event.id });
      return { ignored: true };
    }

    await applyProviderResult(payment, {
      transactionId: event.data.transactionId,
      status,
      amount: event.data.amount,
      currency: event.data.currency,
      metadata: event.data.metadata,
      failureReason: event.data.failureReason,
    });
    paymentLog("webhook.processed", { eventId: event.id, type: event.type });
    return { processed: true };
  } catch (err) {
    if (err instanceof AppError) {
      // rejected on business grounds (e.g. amount mismatch): acknowledge so the provider stops retrying
      paymentLog("webhook.rejected", {
        eventId: event.id,
        reason: err.message,
      });
      return { rejected: true };
    }
    await WebhookEvent.deleteOne({ eventId: event.id }); // unexpected failure: allow the provider to retry
    throw err;
  }
};
