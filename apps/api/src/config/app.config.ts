import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  api: {
    host: process.env.API_HOST ?? '0.0.0.0',
    port: Number(process.env.API_PORT ?? 3001),
    corsOrigin: process.env.API_CORS_ORIGIN ?? 'http://localhost:5173',
    correlationIdHeader: process.env.CORRELATION_ID_HEADER ?? 'x-correlation-id',
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  queue: {
    inferenceQueueName: process.env.INFERENCE_QUEUE_NAME ?? 'inference-events',
  },
  logging: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
  throttle: {
    ttlMs: Number(process.env.THROTTLE_TTL_MS ?? 60_000),
    limit: Number(process.env.THROTTLE_LIMIT ?? 120),
  },
}));

