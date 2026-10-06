import { Router } from "express";
import { register, login, logout, me } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", authenticate, me);

export default router;
