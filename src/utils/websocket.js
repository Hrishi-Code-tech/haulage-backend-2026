import { WebSocketServer } from 'ws';
import Redis from 'ioredis';
import { ENV } from '../config/env.js';

export const redisPublisher = new Redis(ENV.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});
const redisSubscriber = new Redis(ENV.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

export const connectRedis = async () => {
  await Promise.all([redisPublisher.connect(), redisSubscriber.connect()]);
};

export const closeRedis = async () => {
  await Promise.allSettled([
    redisPublisher.quit(),
    redisSubscriber.quit(),
  ]);
};

export const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  redisSubscriber.psubscribe('telemetry:*').catch((error) => {
    console.error('Failed to subscribe to telemetry channels:', error.message);
  });

  // Route incoming Redis messages only to interested clients
  redisSubscriber.on('pmessage', (pattern, channel, message) => {
    const loadId = channel.split(':')[1];
    
    wss.clients.forEach((client) => {
      // Only send if the client is active and explicitly tracking this load
      if (client.readyState === 1 && client.subscribedLoads?.has(loadId)) {
        client.send(JSON.stringify({
          event: 'live_location',
          load_id: loadId,
          data: JSON.parse(message)
        }));
      }
    });
  });

  // Connection and Subscription Management
  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.subscribedLoads = new Set();

    // Allow initial subscriptions via URL params (e.g., ?loads=123,456)
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const loadsParam = url.searchParams.get('loads');
    if (loadsParam) {
      loadsParam.split(',').forEach(id => ws.subscribedLoads.add(id));
    }

    ws.on('pong', () => { ws.isAlive = true; }); // Heartbeat acknowledgment

    // Allow clients to dynamically subscribe/unsubscribe after connecting
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (typeof data.load_id !== 'string') return;
        if (data.action === 'subscribe') ws.subscribedLoads.add(data.load_id);
        if (data.action === 'unsubscribe') ws.subscribedLoads.delete(data.load_id);
      } catch (error) {
        console.error("Invalid WS message format", error.message);
      }
    });
  });

  // Ping interval to terminate dead connections (Zombie prevention)
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));

  return wss;
};