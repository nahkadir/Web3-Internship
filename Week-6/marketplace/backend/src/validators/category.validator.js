import { z } from "zod";
import { objectId } from "./common.js";

const name = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(60);
const description = z.string().trim().max(300);

export const createCategorySchema = z.object({
  body: z.object({ name, description: description.optional() }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({ name: name.optional(), description: description.optional() })
    .refine(
      (b) => Object.keys(b).length > 0,
      "Provide at least one field to update",
    ),
});
