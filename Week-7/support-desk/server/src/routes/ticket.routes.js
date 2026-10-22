import { Router } from "express";
import {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  changeStatus,
} from "../controllers/ticket.controller.js";
import {
  listMessages,
  createMessage,
  editMessage,
} from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  ticketCreateLimiter,
  messageLimiter,
} from "../middleware/rateLimiters.js";
import {
  createTicketSchema,
  listTicketsSchema,
  ticketIdSchema,
  updateTicketSchema,
  statusSchema,
} from "../validators/ticket.validator.js";
import {
  createMessageSchema,
  editMessageSchema,
  listMessagesSchema,
} from "../validators/message.validator.js";
import { ROLES } from "../models/User.js";

const router = Router();

router.use(protect);

router.post(
  "/",
  authorize(ROLES.CUSTOMER),
  ticketCreateLimiter,
  validate(createTicketSchema),
  createTicket,
);
router.get("/", validate(listTicketsSchema), listTickets);
router.get("/:id", validate(ticketIdSchema), getTicket);
router.patch("/:id", validate(updateTicketSchema), updateTicket);
router.patch("/:id/status", validate(statusSchema), changeStatus);

router.get("/:id/messages", validate(listMessagesSchema), listMessages);
router.post(
  "/:id/messages",
  messageLimiter,
  validate(createMessageSchema),
  createMessage,
);
router.patch(
  "/:id/messages/:messageId",
  messageLimiter,
  validate(editMessageSchema),
  editMessage,
);

export default router;
