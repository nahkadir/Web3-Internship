import { z } from "zod";

export const createBookingSchema = z.object({
  eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid event ID"),
  quantity: z.number().int().positive(),
});
