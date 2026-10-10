import { Router } from "express";
import { create, verify, webhook } from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { paymentOrderSchema } from "../validators/payment.validator.js";

const router = Router();

router.post("/create", authenticate, validate(paymentOrderSchema), create);
router.post("/verify", authenticate, validate(paymentOrderSchema), verify);
router.post("/webhook", webhook); // no login: authenticated by its signature instead

export default router;
