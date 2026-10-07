import { Router } from "express";
import {
  create,
  listMine,
  stats,
  getMine,
  update,
  archive,
} from "../controllers/product.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import {
  attachVendor,
  requireApprovedVendor,
} from "../middleware/vendorGuard.js";
import { validate } from "../middleware/validate.js";
import { ROLES } from "../constants/roles.js";
import {
  createProductSchema,
  updateProductSchema,
  vendorListProductsSchema,
} from "../validators/product.validator.js";
import { idParamSchema } from "../validators/common.js";

const router = Router();

router.use(authenticate, requireRole(ROLES.VENDOR), attachVendor);

// reads work for any vendor status (so pending/suspended vendors can see their dashboard)
router.get("/", validate(vendorListProductsSchema), listMine);
router.get("/stats", stats); // must stay above /:id
router.get("/:id", validate(idParamSchema), getMine);

// writes need an APPROVED vendor
router.post("/", requireApprovedVendor, validate(createProductSchema), create);
router.patch(
  "/:id",
  requireApprovedVendor,
  validate(updateProductSchema),
  update,
);
router.delete("/:id", requireApprovedVendor, validate(idParamSchema), archive);

export default router;
