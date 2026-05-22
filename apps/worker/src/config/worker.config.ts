import { registerAs } from '@nestjs/config';

export const workerConfig = registerAs('worker', () => ({
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  queue: {
    inferenceQueueName: process.env.INFERENCE_QUEUE_NAME ?? 'inference-events',
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
    deadLetterQueueName: process.env.DLQ_NAME ?? 'inference-events-dlq',
    maxRetries: Number(process.env.WORKER_MAX_RETRIES ?? 4),
  },
  log: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
}));
