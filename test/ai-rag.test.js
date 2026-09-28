import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';

test('AI RAG - App mounts /api/ai endpoints and communicates with AI service', async (t) => {
  // Start Express API on an ephemeral port
  const apiServer = app.listen(0);
  const apiPort = apiServer.address().port;
  const baseUrl = `http://localhost:${apiPort}`;

  // Start mock AI service on another ephemeral port
  const mockAiServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');

      if (req.url === '/rag/search' && req.method === 'POST') {
        const payload = JSON.parse(body || '{}');
        res.writeHead(200);
        res.end(JSON.stringify({
          query: payload.query,
          total_results: 1,
          results: [
            {
              point_id: 'test-point-id',
              text: 'Penalty Clause 4.1: Late delivery penalty applies.',
              source: 'contract.pdf',
              clause_type: 'penalty',
              rrf_score: 0.032,
              dense_rank: 1,
              bm25_rank: 1,
            }
          ],
        }));
      } else if (req.url === '/rag/ingest' && req.method === 'POST') {
        res.writeHead(200);
        res.end(JSON.stringify({
          chunks_ingested: 2,
          source: 'test.pdf',
          clause_type: 'penalty',
          bm25_index_size: 10,
        }));
      } else if (req.url === '/rag/status' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({
          qdrant_points: 10,
          bm25_index_size: 10,
          status: 'ready',
        }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ detail: 'Not found' }));
      }
    });
  });

  await new Promise((resolve) => mockAiServer.listen(0, resolve));
  const mockPort = mockAiServer.address().port;
  const originalAiUrl = ENV.AI_SERVICE_URL;
  ENV.AI_SERVICE_URL = `http://localhost:${mockPort}`;

  await t.test('POST /api/ai/rag/search validates request body', async () => {
    const res = await fetch(`${baseUrl}/api/ai/rag/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // missing query
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /Invalid search payload/);
  });

  await t.test('POST /api/ai/rag/search forwards to AI service and returns hybrid results', async () => {
    const res = await fetch(`${baseUrl}/api/ai/rag/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'late delivery penalty' }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.total_results, 1);
    assert.equal(data.data.results[0].clause_type, 'penalty');
  });

  await t.test('POST /api/ai/rag/ingest forwards to AI service', async () => {
    const res = await fetch(`${baseUrl}/api/ai/rag/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'This is a test contract clause about detention charges.',
        source: 'carrier-terms.pdf',
        clause_type: 'terms',
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.chunks_ingested, 2);
  });

  await t.test('GET /api/ai/rag/status proxies AI service status', async () => {
    const res = await fetch(`${baseUrl}/api/ai/rag/status`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.status, 'ready');
  });

  // Cleanup
  ENV.AI_SERVICE_URL = originalAiUrl;
  await new Promise((resolve) => apiServer.close(resolve));
  await new Promise((resolve) => mockAiServer.close(resolve));
});
