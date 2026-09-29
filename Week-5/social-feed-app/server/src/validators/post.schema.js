import { z } from "zod";

const urlOrEmpty = z
  .string()
  .trim()
  .url("Image URL must be a valid URL")
  .optional()
  .or(z.literal(""));

export const createPostSchema = z.object({
  content: z
    .string({ required_error: "Content is required" })
    .trim()
    .min(1, "Content cannot be empty")
    .max(500, "Content must be at most 500 characters"),
  imageUrl: urlOrEmpty,
});
