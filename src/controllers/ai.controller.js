import { z } from 'zod';
import prisma from '../config/db.js';
import { ENV } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// Schemas
const ragIngestSchema = z.object({
  text: z.string().min(10, 'Text must be at least 10 characters'),
  source: z.string().min(1, 'Source is required'),
  clause_type: z.enum(['penalty', 'rate', 'terms', 'general']).default('general'),
  order_id: z.string().uuid().optional(),
});

const ragSearchSchema = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters'),
  top_k: z.number().int().min(1).max(50).default(10),
});

const invoiceAuditSchema = z.object({
  orderId: z.string().uuid('Invalid order ID format'),
  billedAmount: z.number().positive('Billed amount must be positive'),
  invoiceText: z.string().default(''),
  persist: z.boolean().default(true),
});

/**
 * Helper to call AI service with timeout and normalized error handling
 */
const callAiService = async (endpoint, method = 'GET', body = null) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENV.AI_SERVICE_TIMEOUT_MS);

  try {
    const url = `${ENV.AI_SERVICE_URL}${endpoint}`;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data.detail || `AI service returned HTTP ${response.status}`;
      throw new ApiError(response.status === 422 ? 422 : 502, message);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') {
      throw new ApiError(504, 'AI service request timed out');
    }
    throw new ApiError(502, 'AI service unavailable', [error.message]);
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Ingest document chunks into Qdrant & rebuild BM25 index
 * POST /api/ai/rag/ingest
 */
export const ingestDocument = async (req, res) => {
  const parsed = ragIngestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid ingestion payload', parsed.error.issues);
  }

  const result = await callAiService('/rag/ingest', 'POST', parsed.data);
  res.status(200).json(new ApiResponse(200, 'Document ingested successfully', result));
};

/**
 * Perform hybrid dense (Qdrant) + sparse (BM25) search with RRF ranking
 * POST /api/ai/rag/search
 */
export const searchDocuments = async (req, res) => {
  const parsed = ragSearchSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid search payload', parsed.error.issues);
  }

  const result = await callAiService('/rag/search', 'POST', parsed.data);
  res.status(200).json(new ApiResponse(200, 'Hybrid search completed', result));
};

/**
 * Perform hybrid RAG-driven invoice audit and integrate with SettlementInvoice
 * POST /api/ai/rag/audit
 */
export const auditInvoice = async (req, res) => {
  const parsed = invoiceAuditSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid audit payload', parsed.error.issues);
  }

  const { orderId, billedAmount, invoiceText, persist } = parsed.data;

  // Retrieve load and negotiation context from Postgres
  const order = await prisma.orderLoad.findUnique({
    where: { id: orderId },
    include: {
      negotiationLog: true,
      invoice: true,
    },
  });

  if (!order) {
    throw new ApiError(404, `Order ${orderId} not found`);
  }

  const agreedRate = order.negotiationLog?.agreedRate ?? order.targetRate ?? null;

  // Call Python AI service RAG audit
  const auditResult = await callAiService('/rag/audit', 'POST', {
    order_id: orderId,
    billed_amount: billedAmount,
    invoice_text: invoiceText,
    agreed_rate: agreedRate,
  });

  // Integrate with existing SettlementInvoice workflow if persist is enabled
  let savedInvoice = null;
  if (persist) {
    savedInvoice = await prisma.settlementInvoice.upsert({
      where: { orderId },
      update: {
        billedAmount,
        aiAuditStatus: auditResult.audit_status,
        discrepancyFlags: auditResult.discrepancy_flags,
      },
      create: {
        orderId,
        billedAmount,
        aiAuditStatus: auditResult.audit_status,
        discrepancyFlags: auditResult.discrepancy_flags,
      },
    });

    if (auditResult.audit_status === 'DISCREPANCY') {
      await prisma.orderLoad.update({
        where: { id: orderId },
        data: { status: 'AUDIT_FAILED' },
      });
    }
  }

  res.status(200).json(
    new ApiResponse(200, 'Invoice audit completed successfully', {
      ...auditResult,
      persisted_invoice: savedInvoice,
    })
  );
};

/**
 * Get status of the RAG index and Qdrant storage
 * GET /api/ai/rag/status
 */
export const getRagStatus = async (req, res) => {
  const result = await callAiService('/rag/status', 'GET');
  res.status(200).json(new ApiResponse(200, 'RAG status retrieved', result));
};
