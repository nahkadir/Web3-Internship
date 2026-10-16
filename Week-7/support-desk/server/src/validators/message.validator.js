import { z } from "zod";

const objectId = (msg) => z.string().regex(/^[0-9a-fA-F]{24}$/, msg);
const text = z
  .string()
  .trim()
  .min(1, "Message cannot be empty")
  .max(2000, "Message is too long (max 2000 characters)");

const ticketParams = z.object({ id: objectId("Invalid ticket id") });

export const createMessageSchema = z.object({
  params: ticketParams,
  body: z.object({ message: text }),
});

export const editMessageSchema = z.object({
  params: ticketParams.extend({ messageId: objectId("Invalid message id") }),
  body: z.object({ message: text }),
});

export const listMessagesSchema = z.object({
  params: ticketParams,
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    before: objectId("Invalid message id").optional(),
  }),
});
