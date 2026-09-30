import { z } from "zod";

export const createCommentSchema = z.object({
  content: z
    .string({ required_error: "Content is required" })
    .trim()
    .min(1, "Comment cannot be empty")
    .max(300, "Comment must be at most 300 characters"),
});

export const updateCommentSchema = z.object({
  content: z
    .string({ required_error: "Content is required" })
    .trim()
    .min(1, "Comment cannot be empty")
    .max(300, "Comment must be at most 300 characters"),
});
