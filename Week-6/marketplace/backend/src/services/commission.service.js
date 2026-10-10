import { Commission } from "../models/Commission.js";
import { OrderItem } from "../models/OrderItem.js";
import { COMMISSION_STATUS, ORDER_STATUS } from "../constants/statuses.js";
import { env } from "../config/env.js";
import { round2 } from "./pricing.service.js";

// safe to call twice: one commission per order item (upsert on the unique orderItemId)
export const createCommissionsForOrder = async (orderId) => {
  const items = await OrderItem.find({
    orderId,
    status: { $ne: ORDER_STATUS.CANCELLED },
  });
  const rate = env.payment.commissionRate; // configurable, never hard-coded

  for (const item of items) {
    const grossAmount = item.subtotal;
    const commissionAmount = round2(grossAmount * rate);

    await Commission.updateOne(
      { orderItemId: item._id },
      {
        $setOnInsert: {
          orderId,
          orderItemId: item._id,
          vendorId: item.vendorId,
          grossAmount,
          commissionRate: rate,
          commissionAmount,
          vendorAmount: round2(grossAmount - commissionAmount),
          status: COMMISSION_STATUS.PENDING,
        },
      },
      { upsert: true },
    );
  }
};
