import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { WorkerLogger } from './common/logger.service.js';
import { WorkerModule } from './worker.module.js';

async function bootstrap(): Promise<void> {
  // Boot up as a NestJS application context (no HTTP server)
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    bufferLogs: true,
  });

  const logger = app.get(WorkerLogger);
  app.useLogger(logger);

  // Enable graceful shutdown hooks (SIGTERM/SIGINT)
  app.enableShutdownHooks();

  logger.log('Worker service started successfully');
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal worker bootstrap error:', err);
  process.exit(1);
});
