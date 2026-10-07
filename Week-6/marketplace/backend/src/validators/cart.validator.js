import { z } from "zod";
import { objectId } from "./common.js";

const quantity = z.coerce
  .number({ message: "Quantity must be a number" })
  .int("Quantity must be a whole number")
  .min(1, "Quantity must be at least 1")
  .max(100, "Quantity cannot exceed 100");

export const addCartItemSchema = z.object({
  body: z.object({ productId: objectId, quantity }),
});

export const updateCartItemSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ quantity }),
});
