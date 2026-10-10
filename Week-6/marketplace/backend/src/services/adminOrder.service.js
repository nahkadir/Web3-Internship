import { Order } from "../models/Order.js";
import { OrderItem } from "../models/OrderItem.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import { ORDER_STATUS, PAYMENT_STATUS } from "../constants/statuses.js";
import { AppError } from "../utils/AppError.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { buildPagination } from "../utils/pagination.js";
import { groupByVendor } from "./order.service.js";
import { setItemStatus, syncOrderStatus } from "./fulfillment.service.js";
import { cancelUnpaidOrder } from "./orderLifecycle.service.js";

const { CANCELLED, SHIPPED, DELIVERED } = ORDER_STATUS;
const RANK = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
};

export const listAdminOrders = async ({
  search,
  status,
  paymentStatus,
  page,
  limit,
}) => {
  const filter = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    const users = await User.find({ $or: [{ name: rx }, { email: rx }] })
      .select("_id")
      .limit(100);
    filter.$or = [
      { orderNumber: rx },
      { userId: { $in: users.map((u) => u._id) } },
    ];
  }

  const [docs, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "name email"),
    Order.countDocuments(filter),
  ]);

  return {
    orders: docs.map((o) => {
      const { userId, ...rest } = o.toJSON();
      return { ...rest, customer: userId };
    }),
    pagination: buildPagination(page, limit, total),
  };
};

export const getAdminOrder = async (id) => {
  const order = await Order.findById(id).populate("userId", "name email");
  if (!order) throw new AppError("Order not found", 404);

  const [items, payments] = await Promise.all([
    OrderItem.find({ orderId: id })
      .populate("vendorId", "storeName")
      .sort({ createdAt: 1 })
      .lean(),
    Payment.find({ orderId: id }).sort({ createdAt: -1 }),
  ]);

  const { userId, ...rest } = order.toJSON();
  return {
    ...rest,
    customer: userId,
    groups: groupByVendor(items),
    payments: payments.map((p) => p.toJSON()),
  };
};

export const updateAdminOrderStatus = async (id, status) => {
  const order = await Order.findById(id);
  if (!order) throw new AppError("Order not found", 404);
  if ([CANCELLED, DELIVERED].includes(order.status)) {
    throw new AppError(
      `This order is already ${order.status.toLowerCase()}`,
      409,
    );
  }

  const items = await OrderItem.find({ orderId: order._id });

  if (status === CANCELLED) {
    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      throw new AppError(
        "This order has been paid. Refund the payment to cancel it.",
        409,
      );
    }
    if (items.some((i) => [SHIPPED, DELIVERED].includes(i.status))) {
      throw new AppError("Orders with shipped items cannot be cancelled", 409);
    }
    await cancelUnpaidOrder(order, "Cancelled by admin");
  } else {
    if (order.paymentStatus !== PAYMENT_STATUS.PAID) {
      throw new AppError(
        "The order must be paid before it can be fulfilled",
        409,
      );
    }
    const movable = items.filter(
      (i) => i.status !== CANCELLED && RANK[i.status] < RANK[status],
    ); // forward only
    if (!movable.length)
      throw new AppError(`No items can be moved to ${status}`, 400);

    for (const item of movable) await setItemStatus(item, status);
    await syncOrderStatus(order._id);
  }

  return getAdminOrder(id);
};
