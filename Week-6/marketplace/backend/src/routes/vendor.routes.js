import { Router } from "express";
import {
  apply,
  myVendor,
  publicVendor,
  publicList,
} from "../controllers/vendor.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { applyVendorSchema } from "../validators/vendor.validator.js";
import { idParamSchema } from "../validators/common.js";

const router = Router();

router.post("/", authenticate, validate(applyVendorSchema), apply);
router.get("/me", authenticate, myVendor); // must stay above /:id
router.get("/:id", validate(idParamSchema), publicVendor);
router.get("/", publicList);

export default router;
