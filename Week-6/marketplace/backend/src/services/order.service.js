import { randomBytes } from "crypto";
import { Cart } from "../models/Cart.js";
import { CartItem } from "../models/CartItem.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { OrderItem } from "../models/OrderItem.js";
import { ORDER_STATUS, PRODUCT_STATUS } from "../constants/statuses.js";
import { AppError } from "../utils/AppError.js";
import { buildPagination } from "../utils/pagination.js";
import { itemIssue, isOwnProduct } from "./availability.js";
import { calculateTotals, lineSubtotal, round2 } from "./pricing.service.js";
import { deriveOrderStatus } from "./orderStatus.js";

const makeOrderNumber = () =>
  `ORD-${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString("hex").toUpperCase()}`;

/* ---------- serializers (shared with vendor orders) ---------- */

export const serializeItem = (i) => ({
  id: i._id,
  productId: i.productId,
  productName: i.productName,
  productImage: i.productImage,
  unitPrice: i.unitPrice,
  quantity: i.quantity,
  subtotal: i.subtotal,
  status: i.status,
});

// items must be lean and have vendorId populated ("storeName")
const groupByVendor = (items) => {
  const map = new Map();
  for (const it of items) {
    const key = String(it.vendorId._id);
    if (!map.has(key)) {
      map.set(key, {
        vendor: { id: it.vendorId._id, storeName: it.vendorId.storeName },
        items: [],
        subtotal: 0,
      });
    }
    const group = map.get(key);
    group.items.push(serializeItem(it));
    group.subtotal = round2(group.subtotal + it.subtotal);
  }
  return [...map.values()].map((g) => ({
    ...g,
    status: deriveOrderStatus(g.items.map((i) => i.status)),
  }));
};

/* ---------- checkout (Tasks 8 & 10) ---------- */

const restoreStock = async (lines) => {
  if (!lines.length) return;
  await Product.bulkWrite(
    lines.map((l) => ({
      updateOne: {
        filter: { _id: l.productId },
        update: { $inc: { stock: l.quantity } },
      },
    })),
  );
};

export const placeOrder = async (user) => {
  const cart = await Cart.findOne({ userId: user._id });
  const cartItems = cart ? await CartItem.find({ cartId: cart._id }) : [];
  if (!cartItems.length) throw new AppError("Your cart is empty", 400);

  // 1. validate every item against the database
  const products = await Product.find({
    _id: { $in: cartItems.map((i) => i.productId) },
  }).populate("vendorId", "storeName status userId");
  const byId = new Map(products.map((p) => [p.id, p]));

  const problems = [];
  const lines = [];

  for (const item of cartItems) {
    const product = byId.get(String(item.productId));
    const issue =
      itemIssue(product, item.quantity) ??
      (isOwnProduct(product, user) ? "You cannot buy your own product" : null);

    if (issue) {
      problems.push({
        field: String(item.productId),
        message: `${product?.name ?? "A product"}: ${issue}`,
      });
      continue;
    }

    lines.push({
      productId: product._id,
      vendorId: product.vendorId._id,
      productName: product.name, // snapshot at time of purchase
      productImage: product.images?.[0] ?? "",
      unitPrice: product.price, // price comes from the DB, never from the client
      quantity: item.quantity,
      subtotal: lineSubtotal(product.price, item.quantity),
    });
  }

  if (problems.length)
    throw new AppError(
      "Some items in your cart can't be ordered",
      409,
      problems,
    );

  // 2. reserve stock atomically, create the order, roll back everything on failure
  const reserved = [];
  let order = null;

  try {
    for (const line of lines) {
      const res = await Product.updateOne(
        {
          _id: line.productId,
          status: PRODUCT_STATUS.ACTIVE,
          stock: { $gte: line.quantity },
        },
        { $inc: { stock: -line.quantity } },
      );
      if (res.modifiedCount !== 1) {
        throw new AppError(
          `"${line.productName}" no longer has enough stock`,
          409,
        );
      }
      reserved.push(line);
    }

    order = await Order.create({
      userId: user._id,
      orderNumber: makeOrderNumber(),
      status: ORDER_STATUS.PENDING,
      ...calculateTotals(lines), // server-side totals
    });
    await OrderItem.insertMany(
      lines.map((l) => ({ ...l, orderId: order._id })),
    );
  } catch (err) {
    await restoreStock(reserved);
    if (order) {
      await OrderItem.deleteMany({ orderId: order._id });
      await order.deleteOne();
    }
    throw err;
  }

  // 3. success: clear the ordered cart items and hide products that just sold out
  await CartItem.deleteMany({ _id: { $in: cartItems.map((i) => i._id) } });
  await Product.updateMany(
    {
      _id: { $in: lines.map((l) => l.productId) },
      status: PRODUCT_STATUS.ACTIVE,
      stock: 0,
    },
    { status: PRODUCT_STATUS.OUT_OF_STOCK },
  );

  return getCustomerOrder(user._id, order._id);
};

/* ---------- customer orders (Task 11) ---------- */

export const listCustomerOrders = async (userId, { page, limit }) => {
  const [orders, total] = await Promise.all([
    Order.find({ userId })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments({ userId }),
  ]);

  const items = await OrderItem.find({
    orderId: { $in: orders.map((o) => o._id) },
  })
    .select("orderId productImage quantity")
    .lean();

  const summary = new Map();
  for (const it of items) {
    const key = String(it.orderId);
    const s = summary.get(key) ?? { itemCount: 0, previewImages: [] };
    s.itemCount += it.quantity;
    if (it.productImage && s.previewImages.length < 3)
      s.previewImages.push(it.productImage);
    summary.set(key, s);
  }

  return {
    orders: orders.map((o) => ({
      ...o.toJSON(),
      ...(summary.get(o.id) ?? { itemCount: 0, previewImages: [] }),
    })),
    pagination: buildPagination(page, limit, total),
  };
};

export const getCustomerOrder = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, userId }); // someone else's order = 404
  if (!order) throw new AppError("Order not found", 404);

  const items = await OrderItem.find({ orderId: order._id })
    .populate("vendorId", "storeName")
    .sort({ createdAt: 1 })
    .lean();

  return { ...order.toJSON(), groups: groupByVendor(items) };
};
