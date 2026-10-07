import { Router } from "express";
import { listPublic, getPublic } from "../controllers/product.controller.js";
import { validate } from "../middleware/validate.js";
import { listProductsSchema } from "../validators/product.validator.js";
import { idParamSchema } from "../validators/common.js";

const router = Router();

router.get("/", validate(listProductsSchema), listPublic);
router.get("/:id", validate(idParamSchema), getPublic);

export default router;
