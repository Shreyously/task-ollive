export interface WorkerConfig {
  redis: { url: string };
  database: { url: string };
  queue: {
    inferenceQueueName: string;
    concurrency: number;
  };
  log: { level: string };
}

export function loadConfig(): WorkerConfig {
  return {
    redis: {
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    },
    database: {
      url: process.env.DATABASE_URL ?? '',
    },
    queue: {
      inferenceQueueName: process.env.INFERENCE_QUEUE_NAME ?? 'inference-events',
      concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
    },
    log: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  };
}
