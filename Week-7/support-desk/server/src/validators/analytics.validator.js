import { z } from "zod";

export const analyticsSchema = z.object({
  query: z
    .object({
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
      groupBy: z.enum(["day", "week", "month"]).default("day"),
    })
    .refine((q) => !q.from || !q.to || q.from <= q.to, {
      message: '"from" must be before "to"',
    }),
});
