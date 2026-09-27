import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: Number(process.env.PORT || 3000),
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  ROUTING_ENGINE_URL: process.env.ROUTING_ENGINE_URL || "http://localhost:8000",
  ROUTING_ENGINE_TIMEOUT_MS: Number(process.env.ROUTING_ENGINE_TIMEOUT_MS || 10_000),
  ROUTE_STATE_TTL_SECONDS: Number(process.env.ROUTE_STATE_TTL_SECONDS || 86_400),
  NODE_ENV: process.env.NODE_ENV || "development",
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || "http://localhost:8002",
  AI_SERVICE_TIMEOUT_MS: Number(process.env.AI_SERVICE_TIMEOUT_MS || 60_000),
};
