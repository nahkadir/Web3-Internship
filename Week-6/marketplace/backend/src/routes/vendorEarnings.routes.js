import { Router } from "express";
import { vendorEarnings } from "../controllers/earnings.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import { attachVendor } from "../middleware/vendorGuard.js";
import { validate } from "../middleware/validate.js";
import { ROLES } from "../constants/roles.js";
import { earningsSchema } from "../validators/payment.validator.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole(ROLES.VENDOR),
  attachVendor,
  validate(earningsSchema),
  vendorEarnings,
);

export default router;
