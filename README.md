# Haulage Backend

Haulage is a containerized logistics backend for load management, GPS telemetry, driver matching, real-time tracking, and direct media uploads.

## TL;DR

- **Node.js API**: Express 5, ESM, WebSockets, Prisma, Redis, and S3 presigning.
- **PostgreSQL**: Stores tenants, loads, drivers, telemetry, negotiations, and settlement invoices.
- **Redis**: Publishes `telemetry:<load_id>` events, serves live WebSocket updates, and stores temporary expected-route state.
- **Closed-loop worker**: Consumes telemetry, detects delays over 15 minutes, and requests alternate driver matches.
- **Routing engine**: FastAPI plus Google OR-Tools calculates a baseline coordinate distance-matrix order.
- **Qdrant**: Available in Compose for future vector/search workflows.
- **Docker Compose**: Runs API, worker, routing engine, PostgreSQL, Redis, and Qdrant.
- **Prisma**: Uses a Linux-compatible Alpine query engine and automatically applies migrations when the API container starts.

## Architecture

```text
Driver GPS -> POST /api/telemetry/ingest
                    |
                    +-> PostgreSQL telemetry_logs
                    +-> Redis telemetry:<load_id>
                              |
                 +------------+-------------+
                 |                          |
          WebSocket clients          closed-loop worker
                                             |
                                  route:expected:<load_id>
                                             |
                                    FastAPI OR-Tools
```

The Node API is exposed on port `8000` in the current Compose environment. The routing engine is exposed on port `8001` on the host and remains on port `8000` inside the Compose network.

## Services and Commands

```powershell
# Start or rebuild everything
docker compose up -d --build

# View service state
docker compose ps

# View logs
docker compose logs -f api worker routing-engine

# Stop the stack
docker compose down

# Run local Node tests
npm test
```

The API container runs `prisma generate`, `prisma migrate deploy`, and then starts the development server. The migration command is safe to run repeatedly because Prisma tracks applied migrations.

## API Endpoints

### Health

```text
GET /health
GET http://localhost:8001/health
```

### Telemetry

```text
POST /api/telemetry/ingest
```

Request:

```json
{
  "load_id": "00000000-0000-0000-0000-000000000000",
  "latitude": 40.7128,
  "longitude": -74.006,
  "timestamp": "2026-09-23T12:00:00.000Z"
}
```

The API persists the point and publishes it to `telemetry:<load_id>`. WebSocket clients can subscribe with `?loads=<load_id>`.

### Expected route state

```text
PUT /internal/routes/:loadId/expected
```

This writes the temporary Redis key `route:expected:<loadId>` used by the closed-loop worker.

```json
{
  "origin": { "latitude": 40.7128, "longitude": -74.006 },
  "destination": { "latitude": 40.758, "longitude": -73.9855 },
  "weight": 1000,
  "expected_arrival": "2026-09-23T14:00:00.000Z",
  "nearby_drivers": [
    { "latitude": 40.7306, "longitude": -73.9352 },
    { "latitude": 40.6892, "longitude": -74.0445 }
  ]
}
```

### Driver matching

```text
POST /internal/optimize-matching
```

The Node API validates and forwards the request to FastAPI. FastAPI returns `matches` and their original `driver_indexes`.

```json
{
  "load": {
    "origin": { "latitude": 40.7128, "longitude": -74.006 },
    "destination": { "latitude": 40.758, "longitude": -73.9855 },
    "weight": 1000
  },
  "nearby_drivers": [
    { "latitude": 40.7306, "longitude": -73.9352 }
  ]
}
```

### Media uploads

```text
POST /api/media/invoices/presign
POST /api/media/pallet-photos/presign
```

Both return a 15-minute S3 PUT URL. Supported invoice types are PDF, JPEG, and PNG. Supported pallet-photo types are JPEG, PNG, and WebP. Objects use private, server-side encrypted keys under `loads/<load_id>/...`.

## Environment

Copy `.env.example` to `.env` and configure:

- PostgreSQL: `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
- Redis: `REDIS_URL`
- Routing: `ROUTING_PORT`, `ROUTING_ENGINE_TIMEOUT_MS`, `ROUTE_STATE_TTL_SECONDS`
- S3: `AWS_REGION`, `S3_BUCKET`, plus AWS credentials or an IAM role
- Qdrant host ports: `QDRANT_HTTP_PORT`, `QDRANT_GRPC_PORT`

The default Qdrant host ports are `6335` and `6336` to avoid collisions with an existing local Qdrant installation. Container-to-container traffic still uses Qdrant ports `6333` and `6334`.

## Database Model

Prisma models currently cover:

- `Tenant`
- `CarrierDriver`
- `OrderLoad`
- `TelemetryLog`
- `AiNegotiationLog`
- `SettlementInvoice`

Run migration status from the API container:

```powershell
docker compose exec api npx prisma migrate status
```

## Current Limitations and Next Production Work

1. Add authentication and tenant authorization to public and internal routes.
2. Add driver IDs, capacity, availability, and road-distance data to matching.
3. Replace straight-line distance with a road routing provider for production dispatching.
4. Persist uploaded media metadata and add malware scanning and S3 lifecycle policies.
5. Add Redis consumer-group or durable queue semantics if telemetry events cannot be lost.
6. Add automated API, worker, routing, and Prisma integration tests.
7. Add structured logs, metrics, tracing, and alerting.
8. Integrate Qdrant only when a concrete semantic search or document retrieval workflow is defined.
