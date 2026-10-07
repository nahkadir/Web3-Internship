import { z } from "zod";
import { objectId } from "./common.js";

export const listOrdersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

export const updateOrderStatusSchema = z.object({
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
