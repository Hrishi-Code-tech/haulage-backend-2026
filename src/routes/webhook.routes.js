import express from "express";
import {
  ingestEmail,
  handleVoiceNegotiation,
  handleWarehouseVision,
  handleInvoiceAudit,
} from "../controllers/webhook.controller.js";

const router = express.Router();

router.post("/ingest-email", ingestEmail);
router.post("/voice-negotiation", handleVoiceNegotiation);
router.post("/warehouse-vision", handleWarehouseVision);
router.post("/invoice-audit", handleInvoiceAudit);

export { router as webhookRoutes };
