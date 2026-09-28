import express from 'express';
import {
  ingestDocument,
  searchDocuments,
  auditInvoice,
  getRagStatus,
  ingestEmailAi,
} from '../controllers/ai.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// Track 1: Hybrid RAG routes
router.post('/rag/ingest', asyncHandler(ingestDocument));
router.post('/rag/search', asyncHandler(searchDocuments));
router.post('/rag/audit', asyncHandler(auditInvoice));
router.get('/rag/status', asyncHandler(getRagStatus));

// Track 2: Agentic Data Ingestion demo routes
router.post('/ingest-email', asyncHandler(ingestEmailAi));
router.post('/ingest/email', asyncHandler(ingestEmailAi));

export default router;
