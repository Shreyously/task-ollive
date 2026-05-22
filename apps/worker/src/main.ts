import type { InferenceEventEnvelope } from '@repo/inference-sdk';
import { INFERENCE_JOB_NAME } from '@repo/shared-types';
import { Worker } from 'bullmq';
import { Redis } from 'ioredis';

import { loadConfig } from './config.js';
import { createPrismaClient } from './db.js';
import { createLogger } from './logger.js';
import { processInferenceEvent } from './processor.js';

export function startWorker(): void {
  try {
    const config = loadConfig();
    const logger = createLogger(config.log.level);
    const prisma = createPrismaClient(config.database.url);

    const connection = new Redis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    const worker = new Worker(
      config.queue.inferenceQueueName,
      async (job) => {
        if (job.name !== INFERENCE_JOB_NAME) {
          logger.warn({ jobName: job.name }, 'unknown.job.skipped');
          return;
        }
        const envelope = job.data as InferenceEventEnvelope;
        await processInferenceEvent(envelope, prisma, logger);
      },
      {
        connection,
        concurrency: config.queue.concurrency,
      },
    );

    // --- Event listeners ---
    worker.on('completed', (job) => {
      logger.debug({ jobId: job.id }, 'job.completed');
    });

    worker.on('failed', (job, err) => {
      logger.error(
        { jobId: job?.id, error: err.message, attempt: job?.attemptsMade },
        'job.failed',
      );
    });

    worker.on('error', (err) => {
      logger.error({ error: err.message }, 'worker.error');
    });

    // --- Graceful shutdown ---
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'worker.shutting_down');
      try {
        await worker.close();
        await prisma.$disconnect();
        await connection.quit();
        logger.info('worker.stopped');
        process.exit(0);
      } catch (err) {
        logger.error({ error: (err as Error).message }, 'worker.shutdown.error');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => {
      void shutdown('SIGTERM');
    });
    process.on('SIGINT', () => {
      void shutdown('SIGINT');
    });

    logger.info(
      {
        queue: config.queue.inferenceQueueName,
        concurrency: config.queue.concurrency,
      },
      'worker.started',
    );
  } catch (err) {
    console.error('Fatal worker bootstrap error:', err);
    process.exit(1);
  }
}

startWorker();
