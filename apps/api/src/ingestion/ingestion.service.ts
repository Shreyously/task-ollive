import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { InferenceEventEnvelope } from '@repo/inference-sdk';
import { INFERENCE_JOB_NAME } from '@repo/shared-types';
import { Queue } from 'bullmq';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @InjectQueue('inference-events')
    private readonly ingestionQueue: Queue,
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
      this.logger.debug(`Enqueued inference event ${envelope.correlationId}`);
    } catch (err) {
      // Graceful degradation: log and swallow — never crash inference flow
      this.logger.error(`Failed to enqueue inference event: ${(err as Error).message}`);
    }
  }
}


