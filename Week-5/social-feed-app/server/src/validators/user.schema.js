import { z } from "zod";

const urlOrEmpty = z
  .string()
  .trim()
  .url("Avatar must be a valid URL")
  .optional()
  .or(z.literal(""));

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be at most 50 characters")
      .optional(),
    bio: z
      .string()
      .trim()
      .max(160, "Bio must be at most 160 characters")
      .optional(),
    avatar: urlOrEmpty,
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.bio !== undefined ||
      data.avatar !== undefined,
    {
      message: "Provide at least one field to update",
    },
  );
