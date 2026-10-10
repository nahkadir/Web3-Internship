import { Router } from "express";
import * as ctrl from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { ROLES } from "../constants/roles.js";
import { idParamSchema } from "../validators/common.js";
import {
  adminListPaymentsSchema,
  refundSchema,
  adminListOrdersSchema,
  adminOrderStatusSchema,
} from "../validators/payment.validator.js";

const router = Router();
const adminOnly = [authenticate, requireRole(ROLES.ADMIN)];

router.get("/stats", ...adminOnly, ctrl.stats);

router.get(
  "/payments",
  ...adminOnly,
  validate(adminListPaymentsSchema),
  ctrl.listPayments,
);
router.get(
  "/payments/:id",
  ...adminOnly,
  validate(idParamSchema),
  ctrl.getPayment,
);
router.post(
  "/payments/:id/refund",
  ...adminOnly,
  validate(refundSchema),
  ctrl.refund,
);

router.get(
  "/orders",
  ...adminOnly,
  validate(adminListOrdersSchema),
  ctrl.listOrders,
);
router.get("/orders/:id", ...adminOnly, validate(idParamSchema), ctrl.getOrder);
router.patch(
  "/orders/:id/status",
  ...adminOnly,
  validate(adminOrderStatusSchema),
  ctrl.updateOrderStatus,
);

export default router;
