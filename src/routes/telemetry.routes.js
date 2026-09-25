import express from 'express';
import { ingestTelemetry, getTelemetryHistory } from '../controllers/telemetry.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.post('/ingest', asyncHandler(ingestTelemetry));
router.get('/orders/:loadId', asyncHandler(getTelemetryHistory));

export default router;