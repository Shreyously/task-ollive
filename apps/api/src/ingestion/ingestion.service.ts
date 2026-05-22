import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { InferenceEventEnvelope } from '@repo/inference-sdk';
import { INFERENCE_JOB_NAME } from '@repo/shared-types';
import { Queue } from 'bullmq';

import { AppLogger } from '../common/logging/logger.service.js';
import { serializeError } from '../common/logging/error-serializer.js';

@Injectable()
export class IngestionService {
  constructor(
    @InjectQueue('inference-events')
    private readonly ingestionQueue: Queue,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Enqueue an inference event for async persistence.
   * Fire-and-forget — errors are caught so inference execution is never blocked by observability.
   */
  async enqueue(envelope: InferenceEventEnvelope): Promise<void> {
    try {
      await this.ingestionQueue.add(INFERENCE_JOB_NAME, envelope, {
        attempts: 4,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 2000 },
      });
      this.logger.withContext().debug(
        { correlationId: envelope.correlationId },
        'ingestion.enqueued',
      );
    } catch (err) {
      // Graceful degradation: log and swallow — never crash inference flow
      this.logger.withContext().error(
        {
          correlationId: envelope.correlationId,
          error: serializeError(err),
        },
        'ingestion.failed',
      );
    }
  }
}


