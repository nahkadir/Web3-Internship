import { Router } from "express";
import {
  list,
  markRead,
  markAllRead,
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  listNotificationsSchema,
  notificationIdSchema,
} from "../validators/notification.validator.js";

const router = Router();

router.use(protect);

router.get("/", validate(listNotificationsSchema), list);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", validate(notificationIdSchema), markRead);

export default router;
