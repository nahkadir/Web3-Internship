import { z } from "zod";
import { EVENT_STATUSES } from "../models/Event.js";

const baseEvent = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(1).max(2000),
  location: z.string().trim().min(2).max(200),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  totalSeats: z.number().int().positive(),
  price: z.number().min(0),
});

export const createEventSchema = baseEvent.refine(
  (d) => d.endDate > d.startDate,
  {
    message: "endDate must be after startDate",
    path: ["endDate"],
  },
);

export const updateEventSchema = baseEvent
  .partial()
  .extend({ status: z.enum(EVENT_STATUSES).optional() })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field is required",
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate > d.startDate, {
    message: "endDate must be after startDate",
    path: ["endDate"],
  });

export const listEventsQuerySchema = z.object({
  status: z.enum(EVENT_STATUSES).optional(),
  available: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
