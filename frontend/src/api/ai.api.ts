/**
 * AI Service API endpoints
 * Connects frontend to Pratham's AI pipeline:
 *   - Hybrid RAG search (Qdrant + BM25)
 *   - Invoice audit (AI-driven discrepancy detection)
 *   - Email ingestion (unstructured dispatch email → structured load JSON)
 *   - Multi-agent LangGraph streaming (SSE)
 */

import { apiClient } from './client';

// --- Types ---

export interface RagSearchResult {
  results: {
    text: string;
    source: string;
    score: number;
    clause_type: string;
  }[];
}

export interface InvoiceAuditResult {
  audit_status: 'PASS' | 'DISCREPANCY';
  discrepancy_flags: string[];
  reasoning: string;
  persisted_invoice: any | null;
}

export interface EmailIngestionResult {
  load: {
    origin: string;
    destination: string;
    weight_kg: number;
    rate: number;
    pickup_date: string;
    delivery_date: string;
  };
  raw_email_snippet: string;
}

export interface GraphStreamEvent {
  node: string;
  status: string;
  data?: any;
}

// --- API ---

export const aiApi = {
  /**
   * Hybrid RAG search across ingested documents
   * POST /api/ai/rag/search
   */
  async search(query: string, topK: number = 10): Promise<RagSearchResult> {
    return apiClient.post('/ai/rag/search', { query, top_k: topK });
  },

  /**
   * Get RAG index status (document count, Qdrant health)
   * GET /api/ai/rag/status
   */
  async getStatus(): Promise<any> {
    return apiClient.get('/ai/rag/status');
  },

  /**
   * AI-powered invoice audit with penalty clause detection
   * POST /api/ai/rag/audit
   */
  async auditInvoice(
    orderId: string,
    billedAmount: number,
    invoiceText: string = '',
    persist: boolean = true
  ): Promise<InvoiceAuditResult> {
    return apiClient.post('/ai/rag/audit', {
      orderId,
      billedAmount,
      invoiceText,
      persist,
    });
  },

  /**
   * Parse unstructured dispatch email into a structured load
   * POST /api/ai/ingest-email
   */
  async ingestEmail(emailText: string): Promise<EmailIngestionResult> {
    return apiClient.post('/ai/ingest-email', { email_text: emailText });
  },

  /**
   * Stream multi-agent LangGraph execution via SSE
   * POST /api/ai/graph/stream
   * Returns an EventSource-compatible reader
   */
  streamGraph(
    emailText: string,
    invoiceAmount?: number,
    onEvent: (event: GraphStreamEvent) => void = () => {},
    onDone: () => void = () => {},
    onError: (error: string) => void = () => {}
  ): AbortController {
    const controller = new AbortController();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

    fetch(`${apiUrl}/ai/graph/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
      },
      body: JSON.stringify({ email_text: emailText, invoice_amount: invoiceAmount }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          onError(`AI service returned ${response.status}`);
          return;
        }
        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                onEvent(data);
              } catch {
                // non-JSON SSE line, skip
              }
            }
          }
        }
        onDone();
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          onError(err.message);
        }
      });

    return controller;
  },
};
