import { Cart } from "../models/Cart.js";
import { CartItem } from "../models/CartItem.js";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/AppError.js";
import { itemIssue, isOwnProduct } from "./availability.js";
import { calculateTotals, lineSubtotal, round2 } from "./pricing.service.js";

const getOrCreateCart = (userId) =>
  Cart.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

const loadProduct = (productId) =>
  Product.findById(productId).populate("vendorId", "storeName status userId");

/* ---------- view (Tasks 3, 6, 7) ---------- */

export const getCartView = async (userId) => {
  const empty = {
    groups: [],
    itemCount: 0,
    hasIssues: false,
    totals: calculateTotals([]),
  };

  const cart = await Cart.findOne({ userId });
  if (!cart) return empty;

  const items = await CartItem.find({ cartId: cart._id })
    .sort({ createdAt: 1 })
    .populate({
      path: "productId",
      select: "name images price stock status vendorId",
      populate: { path: "vendorId", select: "storeName status" },
    });

  const groups = new Map();
  const lines = [];
  let itemCount = 0;
  let hasIssues = false;

  for (const item of items) {
    const product = item.productId; // null if the product was removed
    const issue = itemIssue(product, item.quantity);
    const unitPrice = product?.price ?? 0; // price always comes from the DB
    const subtotal = lineSubtotal(unitPrice, item.quantity);
    const vendor = product?.vendorId;
    const key = vendor ? String(vendor._id) : "unavailable";

    if (!groups.has(key)) {
      groups.set(key, {
        vendor: {
          id: vendor?.id ?? null,
          storeName: vendor?.storeName ?? "Unavailable items",
        },
        items: [],
        subtotal: 0,
      });
    }
    const group = groups.get(key);
    group.items.push({
      id: item.id,
      productId: product?.id ?? null,
      name: product?.name ?? "Unavailable product",
      image: product?.images?.[0] ?? null,
      unitPrice,
      quantity: item.quantity,
      subtotal,
      stock: product?.stock ?? 0,
      issue,
    });
    group.subtotal = round2(group.subtotal + subtotal);

    lines.push({ unitPrice, quantity: item.quantity });
    itemCount += item.quantity;
    if (issue) hasIssues = true;
  }

  return {
    groups: [...groups.values()],
    itemCount,
    hasIssues,
    totals: calculateTotals(lines),
  };
};

/* ---------- mutations (Tasks 2, 4, 5) ---------- */

export const addItem = async (user, { productId, quantity }) => {
  const product = await loadProduct(productId);
  if (!product) throw new AppError("Product not found", 404);
  if (isOwnProduct(product, user))
    throw new AppError("You cannot buy your own product", 403);

  const cart = await getOrCreateCart(user._id);
  const existing = await CartItem.findOne({ cartId: cart._id, productId });
  const newQuantity = (existing?.quantity ?? 0) + quantity;

  const issue = itemIssue(product, newQuantity);
  if (issue) {
    const partial =
      existing && product.stock > 0 && product.stock < newQuantity;
    throw new AppError(
      partial
        ? `Only ${product.stock} available (you already have ${existing.quantity} in your cart)`
        : issue,
      409,
    );
  }

  // increases the existing line instead of creating a duplicate
  await CartItem.findOneAndUpdate(
    { cartId: cart._id, productId },
    { $set: { quantity: newQuantity } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return getCartView(user._id);
};

export const updateItem = async (user, itemId, quantity) => {
  const cart = await getOrCreateCart(user._id);
  const item = await CartItem.findOne({ _id: itemId, cartId: cart._id }); // only the cart owner's items
  if (!item) throw new AppError("Cart item not found", 404);

  const product = await loadProduct(item.productId);
  const issue = itemIssue(product, quantity);
  if (issue) throw new AppError(issue, 409);

  item.quantity = quantity;
  await item.save();
  return getCartView(user._id);
};

export const removeItem = async (user, itemId) => {
  const cart = await getOrCreateCart(user._id);
  const removed = await CartItem.findOneAndDelete({
    _id: itemId,
    cartId: cart._id,
  });
  if (!removed) throw new AppError("Cart item not found", 404);
  return getCartView(user._id);
};
