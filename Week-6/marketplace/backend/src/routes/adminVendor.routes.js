import { Router } from "express";
import {
  adminList,
  adminGet,
  adminUpdateStatus,
} from "../controllers/vendor.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { ROLES } from "../constants/roles.js";
import {
  adminListVendorsSchema,
  updateVendorStatusSchema,
} from "../validators/vendor.validator.js";
import { idParamSchema } from "../validators/common.js";

const router = Router();

router.use(authenticate, requireRole(ROLES.ADMIN));

router.get("/", validate(adminListVendorsSchema), adminList);
router.get("/:id", validate(idParamSchema), adminGet);
router.patch(
  "/:id/status",
  validate(updateVendorStatusSchema),
  adminUpdateStatus,
);

export default router;
