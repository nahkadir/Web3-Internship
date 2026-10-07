import { Router } from "express";
import {
  list,
  getOne,
  updateStatus,
} from "../controllers/vendorOrder.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import {
  attachVendor,
  requireApprovedVendor,
} from "../middleware/vendorGuard.js";
import { validate } from "../middleware/validate.js";
import { ROLES } from "../constants/roles.js";
import {
  listOrdersSchema,
  updateOrderStatusSchema,
} from "../validators/order.validator.js";
import { idParamSchema } from "../validators/common.js";

const router = Router();

router.use(authenticate, requireRole(ROLES.VENDOR), attachVendor);

router.get("/", validate(listOrdersSchema), list);
router.get("/:id", validate(idParamSchema), getOne);
router.patch(
  "/:id/status",
  requireApprovedVendor,
  validate(updateOrderStatusSchema),
  updateStatus,
);

export default router;
