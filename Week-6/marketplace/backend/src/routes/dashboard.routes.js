import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

const dashboard = (label) => (req, res) => {
  res.json({
    success: true,
    message: `Welcome to the ${label} dashboard`,
    user: req.user,
  });
};

router.get(
  "/customer/dashboard",
  authenticate,
  requireRole(ROLES.CUSTOMER),
  dashboard("customer"),
);
router.get(
  "/vendor/dashboard",
  authenticate,
  requireRole(ROLES.VENDOR),
  dashboard("vendor"),
);
router.get(
  "/admin/dashboard",
  authenticate,
  requireRole(ROLES.ADMIN),
  dashboard("admin"),
);

export default router;
