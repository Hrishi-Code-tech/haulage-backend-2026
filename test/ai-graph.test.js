import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';

test('AI Graph - SSE streaming proxy endpoint', async (t) => {
  // Start Express API on an ephemeral port
  const apiServer = app.listen(0);
  const apiPort = apiServer.address().port;
  const baseUrl = `http://localhost:${apiPort}`;

  // Start mock AI service streaming SSE
  const mockAiServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      if (req.url === '/graph/stream' && req.method === 'POST') {
        const payload = JSON.parse(body || '{}');

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });

        const events = [
          { event: 'status', status: 'INGESTING_EMAIL' },
          { event: 'status', status: 'EXTRACTING_LOAD' },
          { event: 'status', status: 'VALIDATING_DATA' },
          { event: 'status', status: 'SEARCHING_DOCUMENTS' },
          { event: 'status', status: 'AUDITING_INVOICE' },
          {
            event: 'completed',
            status: 'COMPLETED',
            load: {
              origin: 'Mumbai',
              destination: 'Delhi',
              rate: 45000,
              equipment_type: 'reefer',
              weight_kg: 12000,
            },
            audit: {
              order_id: 'test-order-id',
              billed_amount: 45000,
              agreed_rate: 45000,
              audit_status: 'PASSED',
              discrepancy_flags: [],
            },
          },
        ];

        for (const ev of events) {
          res.write(`data: ${JSON.stringify(ev)}\n\n`);
        }
        res.end();
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'Not found' }));
      }
    });
  });

  await new Promise((resolve) => mockAiServer.listen(0, resolve));
  const mockPort = mockAiServer.address().port;
  const originalAiUrl = ENV.AI_SERVICE_URL;
  ENV.AI_SERVICE_URL = `http://localhost:${mockPort}`;

  await t.test('POST /api/ai/graph/stream validates request body', async () => {
    const res = await fetch(`${baseUrl}/api/ai/graph/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_text: 'hi' }), // too short
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /at least 5 characters/);
  });

  await t.test('POST /api/ai/graph/stream proxies SSE stream events', async () => {
    const res = await fetch(`${baseUrl}/api/ai/graph/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_text: 'Load pickup from Mumbai to Delhi. Rate is ₹45,000. Need a reefer truck. Weight 12,000 kg.',
        invoice_amount: 45000,
      }),
    });

    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/event-stream/);

    const text = await res.text();
    assert.ok(text.includes('data:'));
    assert.ok(text.includes('INGESTING_EMAIL'));
    assert.ok(text.includes('EXTRACTING_LOAD'));
    assert.ok(text.includes('VALIDATING_DATA'));
    assert.ok(text.includes('SEARCHING_DOCUMENTS'));
    assert.ok(text.includes('AUDITING_INVOICE'));
    assert.ok(text.includes('COMPLETED'));
    assert.ok(text.includes('Mumbai'));
    assert.ok(text.includes('PASSED'));
  });

  // Cleanup
  ENV.AI_SERVICE_URL = originalAiUrl;
  await new Promise((resolve) => apiServer.close(resolve));
  await new Promise((resolve) => mockAiServer.close(resolve));
});
