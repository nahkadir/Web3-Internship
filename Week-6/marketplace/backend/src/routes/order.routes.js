import { Router } from "express";
import { place, list, getOne } from "../controllers/order.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { listOrdersSchema } from "../validators/order.validator.js";
import { idParamSchema } from "../validators/common.js";

const router = Router();

router.use(authenticate);

router.post("/", place); // same logic as POST /api/checkout
router.get("/", validate(listOrdersSchema), list);
router.get("/:id", validate(idParamSchema), getOne);

export default router;
