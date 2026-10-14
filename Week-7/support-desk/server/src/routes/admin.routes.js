import { Router } from "express";
import { getUsers, updateUserRole } from "../controllers/admin.controller.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { updateRoleSchema } from "../validators/admin.validator.js";
import { ROLES } from "../models/User.js";
import {
  getAllTickets,
  assignTicket,
} from "../controllers/admin.controller.js";
import {
  listTicketsSchema,
  assignSchema,
} from "../validators/ticket.validator.js";

const router = Router();

// every route in this file requires a logged-in ADMIN
router.use(protect, authorize(ROLES.ADMIN));

router.get("/users", getUsers);
router.patch("/users/:id/role", validate(updateRoleSchema), updateUserRole);
router.get("/tickets", validate(listTicketsSchema), getAllTickets);
router.patch("/tickets/:id/assign", validate(assignSchema), assignTicket);

export default router;
