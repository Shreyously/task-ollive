import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InferenceProvider, InferenceStatus } from '@prisma/client';
import { INFERENCE_JOB_NAME, INFERENCE_QUEUE_NAME } from '@repo/shared-types';
import { Job } from 'bullmq';

import { WorkerLogger } from '../common/logger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DeadLetterService } from './dead-letter.service.js';
import { ValidationService } from './validation.service.js';

const PROVIDER_MAP: Record<string, InferenceProvider> = {
  google: 'GOOGLE',
  groq: 'GROQ',
};

const STATUS_MAP: Record<string, InferenceStatus> = {
  success: 'SUCCESS',
  error: 'ERROR',
  canceled: 'CANCELED',
};

@Processor(INFERENCE_QUEUE_NAME, {
  concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
})
@Injectable()
export class InferenceProcessor extends WorkerHost {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(WorkerLogger)
    private readonly logger: WorkerLogger,
    @Inject(ValidationService)
    private readonly validationService: ValidationService,
    @Inject(DeadLetterService)
    private readonly dlqService: DeadLetterService,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const correlationId = job.data?.correlationId;
    const jobLogger = this.logger.child({
      jobId: job.id,
      correlationId,
    });

    if (job.name !== INFERENCE_JOB_NAME) {
      jobLogger.warn({ jobName: job.name }, 'unknown.job.skipped');
      return;
    }

    // 1. Validate the payload using validation service
    const envelope = await this.validationService.validate(job.data);
    const event = envelope.payload;

    // 2. Map and persist to Database
    const provider = PROVIDER_MAP[event.provider];
    if (!provider) {
      throw new Error(`Unknown provider: ${event.provider}`);
    }

    const status = STATUS_MAP[event.status] ?? 'ERROR';

    await this.prisma.inferenceLog.create({
      data: {
        requestCorrelationId: envelope.correlationId,
        conversationId: event.conversationId ?? null,
        sessionId: event.sessionId,
        provider,
        model: event.model,
        status,
        errorCode: event.error?.code ?? null,
        errorMessage: event.error?.message ?? null,
        latencyMs: event.latencyMs,
        promptTokens: event.tokenUsage?.promptTokens ?? null,
        completionTokens: event.tokenUsage?.completionTokens ?? null,
        totalTokens: event.tokenUsage?.totalTokens ?? null,
        fallbackFromProvider: event.fallbackMetadata?.fallbackFromProvider
          ? PROVIDER_MAP[event.fallbackMetadata.fallbackFromProvider] ?? null
          : null,
        fallbackFromModel: event.fallbackMetadata?.fallbackFromModel ?? null,
      },
    });

    jobLogger.info(
      { provider, status },
      'inference.log.persisted',
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    const correlationId = job.data?.correlationId;
    this.logger.pino.debug(
      { jobId: job.id, correlationId },
      'job.completed',
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error): Promise<void> {
    const correlationId = job.data?.correlationId;
    this.logger.pino.error(
      {
        jobId: job.id,
        correlationId,
        error: error.message,
        attempt: job.attemptsMade,
      },
      'job.failed',
    );

    const maxRetries =
      this.configService.get<number>('worker.queue.maxRetries') ?? 4;
    if (job.attemptsMade >= maxRetries) {
      await this.dlqService.moveToDeadLetter(job, error);
    }
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.pino.error({ error: error.message }, 'worker.error');
  }
}
