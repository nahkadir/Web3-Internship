import { z } from "zod";
import { objectId } from "./common.js";
import { ORDER_STATUS, PAYMENT_STATUS } from "../constants/statuses.js";

const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(50).default(10);

export const paymentOrderSchema = z.object({
  body: z.object({ orderId: objectId }),
});

export const earningsSchema = z.object({
  query: z.object({
    page,
    limit,
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
});

export const adminListPaymentsSchema = z.object({
  query: z.object({
    search: z.string().trim().max(60).optional(),
    status: z.enum(Object.values(PAYMENT_STATUS)).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page,
    limit,
  }),
});

export const refundSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ reason: z.string().trim().max(200).optional() }).optional(),
});

export const adminListOrdersSchema = z.object({
  query: z.object({
    search: z.string().trim().max(60).optional(),
    status: z.enum(Object.values(ORDER_STATUS)).optional(),
    paymentStatus: z
      .enum(["UNPAID", ...Object.values(PAYMENT_STATUS)])
      .optional(),
    page,
    limit,
  }),
});

export const adminOrderStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    status: z.enum(
      ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
      {
        message: "Invalid order status",
      },
    ),
  }),
});
