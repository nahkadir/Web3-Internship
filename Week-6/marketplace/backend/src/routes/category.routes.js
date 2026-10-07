import { Router } from "express";
import {
  create,
  list,
  update,
  remove,
} from "../controllers/category.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { ROLES } from "../constants/roles.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator.js";
import { idParamSchema } from "../validators/common.js";

const router = Router();
const adminOnly = [authenticate, requireRole(ROLES.ADMIN)];

router.get("/", list); // public: anyone can view categories
router.post("/", ...adminOnly, validate(createCategorySchema), create);
router.patch("/:id", ...adminOnly, validate(updateCategorySchema), update);
router.delete("/:id", ...adminOnly, validate(idParamSchema), remove);

export default router;
