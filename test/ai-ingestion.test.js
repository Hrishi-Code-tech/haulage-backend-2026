import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import prisma from '../src/config/db.js';
import { ENV } from '../src/config/env.js';

test('AI Ingestion - Email parsing and webhook integration', async (t) => {
  // Mock prisma methods for unit testing without live Postgres
  const origFindFirst = prisma.tenant.findFirst;
  const origCreate = prisma.orderLoad.create;
  prisma.tenant.findFirst = async () => ({ id: '00000000-0000-0000-0000-000000000001', name: 'Test Tenant' });
  prisma.orderLoad.create = async ({ data }) => ({
    id: '00000000-0000-0000-0000-000000000099',
    ...data,
    createdAt: new Date(),
  });
  // Start Express API on an ephemeral port
  const apiServer = app.listen(0);
  const apiPort = apiServer.address().port;
  const baseUrl = `http://localhost:${apiPort}`;

  // Start mock AI service on ephemeral port
  const mockAiServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');

      if (req.url === '/ingest/email' && req.method === 'POST') {
        const payload = JSON.parse(body || '{}');
        const text = payload.email_text || '';

        // Deterministic response for testing
        if (text.includes('Mumbai') && text.includes('Delhi')) {
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            load: {
              origin: 'Mumbai',
              destination: 'Delhi',
              rate: 45000,
              equipment_type: 'reefer',
              weight_kg: 12000,
              currency: 'INR',
              confidence: 0.95,
              extracted_by: 'deterministic_fallback',
            },
            raw_email_snippet: text.slice(0, 100),
          }));
        } else if (text.length < 10) {
          res.writeHead(422);
          res.end(JSON.stringify({ detail: 'Dispatch email extraction failed' }));
        } else {
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            load: {
              origin: 'Rotterdam',
              destination: 'Berlin',
              rate: 1200,
              equipment_type: 'dry_van',
              weight_kg: 18000,
              currency: 'EUR',
              confidence: 0.92,
              extracted_by: 'deterministic_fallback',
            },
            raw_email_snippet: text.slice(0, 100),
          }));
        }
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

  await t.test('POST /api/ai/ingest-email validates request body', async () => {
    const res = await fetch(`${baseUrl}/api/ai/ingest-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // missing email_text
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /Invalid email ingestion payload/);
  });

  await t.test('POST /api/ai/ingest-email extracts structured load from raw text', async () => {
    const res = await fetch(`${baseUrl}/api/ai/ingest-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_text: 'Load pickup from Mumbai to Delhi. Rate is ₹45,000. Need a reefer truck. Weight 12,000 kg.',
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.load.origin, 'Mumbai');
    assert.equal(data.load.destination, 'Delhi');
    assert.equal(data.load.rate, 45000);
    assert.equal(data.load.equipment_type, 'reefer');
    assert.equal(data.load.weight_kg, 12000);
  });

  await t.test('POST /api/webhooks/ingest-email supports raw email extraction and creates OrderLoad', async () => {
    const res = await fetch(`${baseUrl}/api/webhooks/ingest-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_text: 'Load pickup from Mumbai to Delhi. Rate is ₹45,000. Need a reefer truck. Weight 12,000 kg.',
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.statusCode, 201);
    assert.ok(data.data.id, 'Expected created OrderLoad ID');
    assert.equal(data.data.origin, 'Mumbai');
    assert.equal(data.data.destination, 'Delhi');
    assert.equal(data.data.targetRate, 45000);
    assert.equal(data.data.weightKg, 12000);
    assert.ok(data.data.extracted, 'Expected extracted metadata');
  });

  await t.test('POST /api/webhooks/ingest-email preserves existing structured payload creation', async () => {
    const res = await fetch(`${baseUrl}/api/webhooks/ingest-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Paris, FR',
        destination: 'Amsterdam, NL',
        targetRate: 950,
        weightKg: 14000,
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.statusCode, 201);
    assert.equal(data.data.origin, 'Paris, FR');
    assert.equal(data.data.destination, 'Amsterdam, NL');
    assert.equal(data.data.targetRate, 950);
  });

  // Cleanup
  prisma.tenant.findFirst = origFindFirst;
  prisma.orderLoad.create = origCreate;
  ENV.AI_SERVICE_URL = originalAiUrl;
  await new Promise((resolve) => apiServer.close(resolve));
  await new Promise((resolve) => mockAiServer.close(resolve));
});
