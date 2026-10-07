import { Order } from "../models/Order.js";
import { OrderItem } from "../models/OrderItem.js";
import { Product } from "../models/Product.js";
import { ORDER_STATUS, PRODUCT_STATUS } from "../constants/statuses.js";
import { AppError } from "../utils/AppError.js";
import { buildPagination } from "../utils/pagination.js";
import { round2 } from "./pricing.service.js";
import { serializeItem } from "./order.service.js";
import {
  deriveOrderStatus,
  ITEM_TRANSITIONS,
  TERMINAL,
} from "./orderStatus.js";

// a vendor's "order segment": only THEIR items from an order, never other vendors' data
const toSegment = (order, items) => ({
  orderId: order.id,
  orderNumber: order.orderNumber,
  customer: { name: order.userId?.name ?? "Customer" },
  createdAt: order.createdAt,
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
  return toSegment(order, items);
};

const syncOrderStatus = async (orderId) => {
  const rows = await OrderItem.find({ orderId }).select("status").lean();
  await Order.updateOne(
    { _id: orderId },
    { status: deriveOrderStatus(rows.map((r) => r.status)) },
  );
};

const restockProduct = async (productId, quantity) => {
  await Product.updateOne({ _id: productId }, { $inc: { stock: quantity } });
  await Product.updateOne(
    { _id: productId, status: PRODUCT_STATUS.OUT_OF_STOCK, stock: { $gt: 0 } },
    { status: PRODUCT_STATUS.ACTIVE },
  );
};

export const updateSegmentStatus = async (vendor, orderId, status) => {
  const items = await OrderItem.find({ orderId, vendorId: vendor._id }); // only this vendor's items
  if (!items.length) throw new AppError("Order not found", 404);

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

  for (const item of movable) {
    // the status in the filter makes a repeated/concurrent request harmless
    const updated = await OrderItem.findOneAndUpdate(
      { _id: item._id, status: item.status },
      { status },
      { new: true },
    );
    if (updated && status === ORDER_STATUS.CANCELLED) {
      await restockProduct(updated.productId, updated.quantity);
    }
  }

  await syncOrderStatus(orderId); // keeps the customer's order status consistent
  return getVendorOrder(vendor, orderId);
};
