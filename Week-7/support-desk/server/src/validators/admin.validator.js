import { z } from "zod";
import { ROLES } from "../models/User.js";

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user id"),
  }),
  body: z.object({
    role: z.enum(Object.values(ROLES), {
      message: `Role must be one of: ${Object.values(ROLES).join(", ")}`,
    }),
  }),
});
