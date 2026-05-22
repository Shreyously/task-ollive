import type { OnModuleInit } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bullmq';

import { WorkerLogger } from '../common/logger.service.js';
import { RedisService } from '../redis/redis.service.js';

@Injectable()
export class DeadLetterService implements OnModuleInit {
  private dlqQueue!: Queue;

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(RedisService)
    private readonly redisService: RedisService,
    @Inject(WorkerLogger)
    private readonly logger: WorkerLogger,
  ) {}

  onModuleInit(): void {
    const dlqName =
      this.configService.get<string>('worker.queue.deadLetterQueueName') ??
      'inference-events-dlq';
    this.dlqQueue = new Queue(dlqName, {
      connection: this.redisService.client,
    });
  }

  async moveToDeadLetter(job: Job, error: Error): Promise<void> {
    const correlationId = job.data?.correlationId;
    this.logger.pino.warn(
      { jobId: job.id, correlationId, attemptsMade: job.attemptsMade, error: error.message },
      'job.moving_to_dlq',
    );

    try {
      await this.dlqQueue.add('dead-letter', {
        originalJobId: job.id,
        originalJobName: job.name,
        originalData: job.data,
        failedAt: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
        },
        attemptsMade: job.attemptsMade,
      });

      this.logger.pino.info(
        { jobId: job.id, correlationId },
        'job.moved_to_dlq.success',
      );
    } catch (dlqErr: unknown) {
      this.logger.pino.error(
        {
          jobId: job.id,
          correlationId,
          error: (dlqErr as Error).message,
        },
        'job.moved_to_dlq.failed',
      );
    }
  }
}
