import { Router } from "express";
import { place } from "../controllers/order.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.post("/", authenticate, place);

export default router;
