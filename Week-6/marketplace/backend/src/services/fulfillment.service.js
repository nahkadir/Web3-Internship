import { Order } from "../models/Order.js";
import { OrderItem } from "../models/OrderItem.js";
import { Product } from "../models/Product.js";
import { Commission } from "../models/Commission.js";
import {
  COMMISSION_STATUS,
  ORDER_STATUS,
  PRODUCT_STATUS,
} from "../constants/statuses.js";
import { deriveOrderStatus } from "./orderStatus.js";

export const restockProduct = async (productId, quantity) => {
  await Product.updateOne({ _id: productId }, { $inc: { stock: quantity } });
  await Product.updateOne(
    { _id: productId, status: PRODUCT_STATUS.OUT_OF_STOCK, stock: { $gt: 0 } },
    { status: PRODUCT_STATUS.ACTIVE },
  );
};

export const syncOrderStatus = async (orderId) => {
  const rows = await OrderItem.find({ orderId }).select("status").lean();
  await Order.updateOne(
    { _id: orderId },
    { status: deriveOrderStatus(rows.map((r) => r.status)) },
  );
};

// returns the updated item, or null if someone else already moved it (safe against repeats)
export const setItemStatus = async (
  item,
  status,
  { restock = true, commissionStatus } = {},
) => {
  const updated = await OrderItem.findOneAndUpdate(
    { _id: item._id, status: item.status },
    { status },
    { new: true },
  );
  if (!updated) return null;

  if (status === ORDER_STATUS.CANCELLED) {
    if (restock) await restockProduct(updated.productId, updated.quantity);
    await Commission.updateOne(
      {
        orderItemId: updated._id,
        status: { $in: [COMMISSION_STATUS.PENDING, COMMISSION_STATUS.PAID] },
      },
      { status: commissionStatus ?? COMMISSION_STATUS.CANCELLED },
    );
  }

  if (status === ORDER_STATUS.DELIVERED) {
    await Commission.updateOne(
      { orderItemId: updated._id, status: COMMISSION_STATUS.PENDING },
      { status: COMMISSION_STATUS.PAID }, // delivered = earning settled
    );
  }
  return updated;
};
