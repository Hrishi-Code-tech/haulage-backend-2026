import express from 'express';
import {
  ingestDocument,
  searchDocuments,
  auditInvoice,
  getRagStatus,
} from '../controllers/ai.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// Track 1: Hybrid RAG routes
router.post('/rag/ingest', asyncHandler(ingestDocument));
router.post('/rag/search', asyncHandler(searchDocuments));
router.post('/rag/audit', asyncHandler(auditInvoice));
router.get('/rag/status', asyncHandler(getRagStatus));

export default router;
