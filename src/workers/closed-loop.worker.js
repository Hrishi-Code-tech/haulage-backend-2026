import Redis from 'ioredis';
import { ENV } from '../config/env.js';

const DELAY_THRESHOLD_MS = 15 * 60 * 1000;
const ALERT_TTL_SECONDS = 60 * 60;

const subscriber = new Redis(ENV.REDIS_URL);
const state = new Redis(ENV.REDIS_URL);

const parseJson = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const requestAlternateMatches = async (loadId, expectedRoute) => {
  const response = await fetch(`${ENV.ROUTING_ENGINE_URL}/internal/optimize-matching`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      load: {
        origin: expectedRoute.origin,
        destination: expectedRoute.destination,
        weight: expectedRoute.weight,
      },
      nearby_drivers: expectedRoute.nearby_drivers,
    }),
  });

  if (!response.ok) {
    throw new Error(`Routing engine returned HTTP ${response.status}`);
  }
  return response.json();
};

const handleTelemetry = async (channel, message) => {
  const telemetry = parseJson(message);
  const loadId = channel.split(':')[1];
  if (!telemetry || !loadId) return;

  const expectedRoute = parseJson(await state.get(`route:expected:${loadId}`));
  if (!expectedRoute?.expected_arrival) return;

  const expectedArrival = new Date(expectedRoute.expected_arrival).getTime();
  const observedAt = new Date(telemetry.timestamp || Date.now()).getTime();
  if (!Number.isFinite(expectedArrival) || !Number.isFinite(observedAt)) return;

  const delayMs = observedAt - expectedArrival;
  if (delayMs <= DELAY_THRESHOLD_MS) return;

  const alertKey = `route:delay-alerted:${loadId}`;
  if (!(await state.set(alertKey, '1', 'EX', ALERT_TTL_SECONDS, 'NX'))) return;

  try {
    const optimization = await requestAlternateMatches(loadId, expectedRoute);
    console.warn(JSON.stringify({
      event: 'route_delay_alert',
      load_id: loadId,
      delay_minutes: Math.round(delayMs / 60000),
      alternate_matches: optimization.matches,
    }));
  } catch (error) {
    await state.del(alertKey);
    console.error(`Alternate route optimization failed for load ${loadId}:`, error.message);
  }
};

const start = async () => {
  await subscriber.psubscribe('telemetry:*');
  subscriber.on('pmessage', (pattern, channel, message) => {
    handleTelemetry(channel, message).catch((error) => {
      console.error('Closed-loop telemetry processing failed:', error.message);
    });
  });
  console.log('Closed-loop route worker listening on telemetry:*');
};

const shutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down closed-loop worker...`);
  await Promise.allSettled([subscriber.quit(), state.quit()]);
  process.exit(0);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
start().catch((error) => {
  console.error('Closed-loop worker startup failed:', error);
  process.exit(1);
});
