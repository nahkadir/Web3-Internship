import { z } from "zod";
import { BOOKING_STATUSES } from "../models/Booking.js";

export const createBookingSchema = z.object({
  eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid event ID"),
  quantity: z.number().int().positive(),
});

export const listBookingsQuerySchema = z.object({
  status: z.enum(BOOKING_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
