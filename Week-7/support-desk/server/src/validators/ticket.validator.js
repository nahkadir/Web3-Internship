import { z } from "zod";
import { STATUS, PRIORITY, CATEGORY } from "../constants/ticket.js";

const objectId = (msg = "Invalid id") =>
  z.string().regex(/^[0-9a-fA-F]{24}$/, msg);
const category = z.enum(Object.values(CATEGORY));
const priority = z.enum(Object.values(PRIORITY));
const subject = z
  .string()
  .trim()
  .min(5, "Subject must be at least 5 characters")
  .max(120, "Subject is too long");
const description = z
  .string()
  .trim()
  .min(10, "Description must be at least 10 characters")
  .max(5000, "Description is too long");

const idParams = z.object({ id: objectId("Invalid ticket id") });

export const createTicketSchema = z.object({
  body: z.object({
    subject,
    description,
    category: category.default("GENERAL"),
  }),
});

export const ticketIdSchema = z.object({ params: idParams });

export const updateTicketSchema = z.object({
  params: idParams,
  body: z
    .object({
      subject: subject.optional(),
      description: description.optional(),
      category: category.optional(),
      priority: priority.optional(),
    })
    .refine((b) => Object.keys(b).length > 0, {
      message: "Provide at least one field to update",
    }),
});

export const statusSchema = z.object({
  params: idParams,
  body: z.object({
    status: z.enum(Object.values(STATUS), { message: "Invalid status" }),
  }),
});

export const assignSchema = z.object({
  params: idParams,
  body: z.object({ agentId: objectId("Invalid agent id") }),
});

export const listTicketsSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(10),
      status: z.enum(Object.values(STATUS)).optional(),
      priority: priority.optional(),
      category: category.optional(),
      assignedTo: z
        .union([objectId("Invalid agent id"), z.literal("unassigned")])
        .optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
      search: z.string().trim().max(100).optional(),
      sortBy: z
        .enum(["createdAt", "updatedAt", "priority", "ticketNumber"])
        .default("createdAt"),
      order: z.enum(["asc", "desc"]).default("desc"),
    })
    .refine((q) => !q.from || !q.to || q.from <= q.to, {
      message: '"from" must be before "to"',
    }),
});
