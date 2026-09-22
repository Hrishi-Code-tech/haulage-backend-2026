import express from 'express';
import { ingestTelemetry } from '../controllers/telemetry.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.post('/ingest', asyncHandler(ingestTelemetry));

export default router;