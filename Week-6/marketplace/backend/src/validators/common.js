import { z } from "zod";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

export const idParamSchema = z.object({ params: z.object({ id: objectId }) });
