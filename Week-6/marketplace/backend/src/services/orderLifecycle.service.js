import { Order } from "../models/Order.js";
import { OrderItem } from "../models/OrderItem.js";
import { Payment } from "../models/Payment.js";
import { ORDER_STATUS, PAYMENT_STATUS } from "../constants/statuses.js";
import { env } from "../config/env.js";
import { paymentLog } from "../utils/paymentLog.js";
import { setItemStatus } from "./fulfillment.service.js";

const { CANCELLED, SHIPPED, DELIVERED, PENDING } = ORDER_STATUS;
const windowMs = () => env.payment.windowMinutes * 60 * 1000;

export const paymentDeadline = (order) =>
  new Date(order.createdAt.getTime() + windowMs());
export const isOrderExpired = (order) => paymentDeadline(order) < new Date();

// cancels every item; goods that already left the warehouse are not restocked
export const cancelOrder = async (
  order,
  { paymentStatus, commissionStatus } = {},
) => {
  const items = await OrderItem.find({ orderId: order._id });
  for (const item of items) {
    if (item.status === CANCELLED) continue;
    const goodsLeft = [SHIPPED, DELIVERED].includes(item.status);
    await setItemStatus(item, CANCELLED, {
      restock: !goodsLeft,
      commissionStatus,
    });
  }
  await Order.updateOne(
    { _id: order._id },
    { status: CANCELLED, ...(paymentStatus && { paymentStatus }) },
  );
};

export const cancelUnpaidOrder = async (order, reason) => {
  await Payment.updateMany(
    {
      orderId: order._id,
      status: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING] },
    },
    { status: PAYMENT_STATUS.CANCELLED, active: false, failureReason: reason },
  );
  await cancelOrder(order, { paymentStatus: PAYMENT_STATUS.CANCELLED });
  paymentLog("order.cancelled_unpaid", { orderId: String(order._id), reason });
};

export const expireUnpaidOrders = async () => {
  const stale = await Order.find({
    status: PENDING,
    paymentStatus: { $in: ["UNPAID", "PENDING", "FAILED", "CANCELLED"] },
    createdAt: { $lt: new Date(Date.now() - windowMs()) },
  }).limit(50);

  for (const order of stale)
    await cancelUnpaidOrder(order, "Payment window expired");
  return stale.length;
};
