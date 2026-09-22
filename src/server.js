import http from 'node:http';
import app from './app.js';
import { ENV } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { closeRedis, connectRedis, setupWebSocket } from './utils/websocket.js';

const server = http.createServer(app);
let shuttingDown = false;

const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}. Shutting down gracefully...`);

  const timeout = setTimeout(() => process.exit(1), 10_000);
  timeout.unref();

  await new Promise((resolve) => server.close(resolve));
  await Promise.allSettled([disconnectDatabase(), closeRedis()]);
  clearTimeout(timeout);
  process.exit(0);
};

const bootstrap = async () => {
  if (!Number.isInteger(ENV.PORT) || ENV.PORT <= 0) {
    throw new Error(`Invalid PORT: ${ENV.PORT}`);
  }

  await connectDatabase();
  await connectRedis();
  setupWebSocket(server);

  server.listen(ENV.PORT, () => {
    console.log(`API Gateway running on http://localhost:${ENV.PORT}`);
  });
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  shutdown('unhandledRejection');
});

bootstrap().catch((error) => {
  console.error('Application startup failed:', error.message);
  process.exit(1);
});