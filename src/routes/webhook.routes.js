import express from "express";
import {
  ingestEmail,
  handleVoiceNegotiation,
  handleWarehouseVision,
  handleInvoiceAudit,
} from "../controllers/webhook.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.post("/ingest-email", asyncHandler(ingestEmail));
router.post("/voice-negotiation", asyncHandler(handleVoiceNegotiation));
router.post("/warehouse-vision", asyncHandler(handleWarehouseVision));
router.post("/invoice-audit", asyncHandler(handleInvoiceAudit));

export { router as webhookRoutes };
