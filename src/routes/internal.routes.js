import express from "express";
import { triggerOptimization, upsertExpectedRoute } from "../controllers/internal.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.post("/optimize-matching", asyncHandler(triggerOptimization));
router.put("/routes/:loadId/expected", asyncHandler(upsertExpectedRoute));

export { router as internalRoutes };
