import { z } from "zod";
import { objectId } from "./common.js";
import { VENDOR_STATUS } from "../constants/statuses.js";

export const applyVendorSchema = z.object({
  body: z.object({
    storeName: z
      .string()
      .trim()
      .min(2, "Store name must be at least 2 characters")
      .max(80),
    storeDescription: z.string().trim().max(1000).optional(),
    logo: z
      .string()
      .trim()
      .url("Logo must be a valid URL")
      .optional()
      .or(z.literal("")),
  }),
});

export const adminListVendorsSchema = z.object({
  query: z.object({
    status: z.enum(Object.values(VENDOR_STATUS)).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export const updateVendorStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED", "SUSPENDED"], {
      message: "Status must be APPROVED, REJECTED or SUSPENDED",
    }),
  }),
});
