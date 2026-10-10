import { Order } from "../models/Order.js";
import { OrderItem } from "../models/OrderItem.js";
import { PAYMENT_STATUS } from "../constants/statuses.js";
import { AppError } from "../utils/AppError.js";
import { buildPagination } from "../utils/pagination.js";
import { round2 } from "./pricing.service.js";
import { serializeItem } from "./order.service.js";
import {
  deriveOrderStatus,
  ITEM_TRANSITIONS,
  TERMINAL,
} from "./orderStatus.js";
import { setItemStatus, syncOrderStatus } from "./fulfillment.service.js";

const VISIBLE = [PAYMENT_STATUS.PAID, PAYMENT_STATUS.REFUNDED];

// a vendor's "order segment": only THEIR items, never other vendors' data
const toSegment = (order, items) => ({
  orderId: order.id,
  orderNumber: order.orderNumber,
  customer: { name: order.userId?.name ?? "Customer" },
  createdAt: order.createdAt,
  paymentStatus: order.paymentStatus,
  status: deriveOrderStatus(items.map((i) => i.status)),
  subtotal: round2(items.reduce((sum, i) => sum + i.subtotal, 0)),
  items: items.map(serializeItem),
});

export const listVendorOrders = async (vendor, { page, limit }) => {
  const [result] = await OrderItem.aggregate([
    { $match: { vendorId: vendor._id } },
    {
      $group: {
        _id: "$orderId",
        items: { $push: "$$ROOT" },
        createdAt: { $max: "$createdAt" },
      },
    },
    {
      $lookup: {
        from: Order.collection.name,
        localField: "_id",
        foreignField: "_id",
        as: "order",
      },
    },
    { $match: { "order.paymentStatus": { $in: VISIBLE } } }, // unpaid orders are invisible to vendors
    { $project: { order: 0 } },
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $facet: {
        rows: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        meta: [{ $count: "total" }],
      },
    },
  ]);

  const orders = await Order.find({
    _id: { $in: result.rows.map((r) => r._id) },
  }).populate("userId", "name");
  const byId = new Map(orders.map((o) => [o.id, o]));

  return {
    orders: result.rows
      .filter((r) => byId.has(String(r._id)))
      .map((r) => toSegment(byId.get(String(r._id)), r.items)),
    pagination: buildPagination(page, limit, result.meta[0]?.total ?? 0),
  };
};

export const getVendorOrder = async (vendor, orderId) => {
  const items = await OrderItem.find({ orderId, vendorId: vendor._id })
    .sort({ createdAt: 1 })
    .lean();
  if (!items.length) throw new AppError("Order not found", 404); // also hides other vendors' orders

  const order = await Order.findById(orderId).populate("userId", "name");
  if (!order || !VISIBLE.includes(order.paymentStatus))
    throw new AppError("Order not found", 404);

  return toSegment(order, items);
};

export const updateSegmentStatus = async (vendor, orderId, status) => {
  const items = await OrderItem.find({ orderId, vendorId: vendor._id });
  if (!items.length) throw new AppError("Order not found", 404);

  const order = await Order.findById(orderId);
  if (!order || order.paymentStatus !== PAYMENT_STATUS.PAID) {
    throw new AppError(
      "Orders can only be fulfilled after payment is confirmed",
      409,
    );
  }

  const movable = items.filter((i) => !TERMINAL.includes(i.status));
  if (!movable.length)
    throw new AppError("This order is already completed or cancelled", 400);

  const blocked = movable.find(
    (i) => !ITEM_TRANSITIONS[i.status].includes(status),
  );
  if (blocked)
    throw new AppError(
      `Cannot change status from ${blocked.status} to ${status}`,
      400,
    );

  for (const item of movable) await setItemStatus(item, status);

  await syncOrderStatus(orderId);
  return getVendorOrder(vendor, orderId);
};
