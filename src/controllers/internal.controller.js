import { z } from 'zod';
import { redisPublisher } from '../utils/websocket.js';
import { ENV } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const optimizationSchema = z.object({
  load: z.object({
    origin: coordinateSchema,
    destination: coordinateSchema,
    weight: z.number().positive(),
  }),
  nearby_drivers: z.array(coordinateSchema).min(1).max(500),
});

const expectedRouteSchema = optimizationSchema.shape.load.extend({
  expected_arrival: z.string().datetime(),
  nearby_drivers: z.array(coordinateSchema).min(1).max(500),
});

const parseBody = (schema, body, message) => {
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, message, parsed.error.issues);
  return parsed.data;
};

export const triggerOptimization = async (req, res) => {
  const payload = parseBody(optimizationSchema, req.body, 'Invalid optimization request');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENV.ROUTING_ENGINE_TIMEOUT_MS);

  try {
    const response = await fetch(`${ENV.ROUTING_ENGINE_URL}/internal/optimize-matching`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiError(response.status === 422 ? 422 : 502, result.detail || 'Routing engine request failed');
    }
    res.status(200).json(new ApiResponse(200, 'Matching optimization completed', result));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, 'Routing engine unavailable', [error.name === 'AbortError' ? 'Request timed out' : error.message]);
  } finally {
    clearTimeout(timeout);
  }
};

export const upsertExpectedRoute = async (req, res) => {
  const loadId = z.string().uuid().safeParse(req.params.loadId);
  if (!loadId.success) throw new ApiError(400, 'Invalid load ID', loadId.error.issues);
  const payload = parseBody(expectedRouteSchema, req.body, 'Invalid expected route');
  const key = `route:expected:${loadId.data}`;
  await redisPublisher.set(key, JSON.stringify(payload), 'EX', ENV.ROUTE_STATE_TTL_SECONDS);
  res.status(200).json(new ApiResponse(200, 'Expected route stored', {
    load_id: loadId.data,
    expires_in: ENV.ROUTE_STATE_TTL_SECONDS,
  }));
};
