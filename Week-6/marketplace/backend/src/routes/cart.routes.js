import { Router } from "express";
import { view, add, update, remove } from "../controllers/cart.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  addCartItemSchema,
  updateCartItemSchema,
} from "../validators/cart.validator.js";
import { idParamSchema } from "../validators/common.js";

const router = Router();

router.use(authenticate);

router.get("/", view);
router.post("/items", validate(addCartItemSchema), add);
router.patch("/items/:id", validate(updateCartItemSchema), update);
router.delete("/items/:id", validate(idParamSchema), remove);

export default router;
