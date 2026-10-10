import { Payment } from "../models/Payment.js";
import { Order } from "../models/Order.js";
import { PAYMENT_STATUS } from "../constants/statuses.js";
import { getProvider } from "../payments/index.js";
import { AppError } from "../utils/AppError.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { buildPagination } from "../utils/pagination.js";
import { paymentLog } from "../utils/paymentLog.js";
import { toMinorUnits } from "./pricing.service.js";
import { cancelOrder } from "./orderLifecycle.service.js";

const { PAID, REFUNDED } = PAYMENT_STATUS;

const populate = (query) =>
  query
    .populate(
      "orderId",
      "orderNumber status paymentStatus totalAmount createdAt",
    )
    .populate("userId", "name email");

const view = (p) => {
  const { orderId, userId, ...rest } = p.toJSON();
  return { ...rest, orderId: orderId?.id, order: orderId, customer: userId };
};

export const listAdminPayments = async ({
  search,
  status,
  from,
  to,
  page,
  limit,
}) => {
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.transactionId = new RegExp(escapeRegex(search), "i");
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) {
      const end = new Date(to);
      end.setUTCHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const [docs, total] = await Promise.all([
    populate(
      Payment.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ),
    Payment.countDocuments(filter),
  ]);

  return {
    payments: docs.map(view),
    pagination: buildPagination(page, limit, total),
  };
};

export const getAdminPayment = async (id) => {
  const payment = await populate(Payment.findById(id));
  if (!payment) throw new AppError("Payment not found", 404);
  return view(payment);
};

export const refundPayment = async (admin, paymentId, reason) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new AppError("Payment not found", 404);
  if (payment.status === REFUNDED)
    throw new AppError("This payment has already been refunded", 409);
  if (payment.status !== PAID)
    throw new AppError("Only paid payments can be refunded", 409);

  // claim the refund so two admins clicking at once cannot refund twice
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: PAID, "refund.startedAt": { $exists: false } },
    { $set: { "refund.startedAt": new Date() } },
    { new: true },
  );
  if (!claimed)
    throw new AppError("A refund for this payment is already in progress", 409);

  let result;
  try {
    // the money is returned by the PROVIDER, never just by editing our database
    result = await getProvider().refund({
      transactionId: payment.transactionId,
      amount: toMinorUnits(payment.amount),
      reason,
    });
  } catch (err) {
    await Payment.updateOne(
      { _id: payment._id },
      { $unset: { "refund.startedAt": "" } },
    );
    paymentLog("refund.failed", { paymentId: payment.id, error: err.message });
    throw err instanceof AppError
      ? err
      : new AppError("The payment provider could not process the refund", 502);
  }

  await Payment.updateOne(
    { _id: payment._id },
    {
      $set: {
        status: REFUNDED,
        active: false,
        "refund.refundId": result.refundId,
        "refund.amount": payment.amount,
        "refund.reason": reason ?? "",
        "refund.refundedAt": new Date(),
        "refund.refundedBy": admin._id,
      },
    },
  );

  // a full refund cancels the order, returns unshipped stock and reverses the vendors' commissions
  const order = await Order.findById(payment.orderId);
  await cancelOrder(order, {
    paymentStatus: REFUNDED,
    commissionStatus: "REFUNDED",
  });

  paymentLog("refund.completed", {
    paymentId: payment.id,
    orderId: String(payment.orderId),
    refundId: result.refundId,
    adminId: admin.id,
  });
  return getAdminPayment(paymentId);
};
