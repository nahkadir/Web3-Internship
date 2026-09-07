import express from "express";
import { getTasks, createTask } from "../controllers/taskController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getTasks);
router.post("/", protect, createTask);

export default router;
