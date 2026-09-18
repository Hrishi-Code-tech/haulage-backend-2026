import express from "express";
import { triggerOptimization } from "../controllers/internal.controller.js";

const router = express.Router();

router.post("/optimize-matching", triggerOptimization);

export { router as internalRoutes };
