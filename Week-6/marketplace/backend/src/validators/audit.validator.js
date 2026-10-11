import { z } from "zod";

export const auditLogsSchema = z.object({
  query: z.object({
    action: z.string().trim().max(60).optional(),
    entityType: z
      .enum(["Vendor", "Category", "Order", "Payment", "Product"])
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
