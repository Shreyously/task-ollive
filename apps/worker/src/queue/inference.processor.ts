import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InferenceProvider, InferenceStatus } from '@prisma/client';
import { INFERENCE_JOB_NAME, INFERENCE_QUEUE_NAME } from '@repo/shared-types';
import { Job } from 'bullmq';

import { WorkerLogger } from '../common/logger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SanitizerService } from '../sanitizer/sanitizer.service.js';
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
    @Inject(SanitizerService)
    private readonly sanitizerService: SanitizerService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const correlationId = (job.data as Record<string, unknown> | undefined)?.correlationId as string | undefined;
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

    // 1.5. Create a sanitized copy of event payload to avoid direct mutation
    const sanitizedError = event.error
      ? {
          ...event.error,
          message: this.sanitizerService.sanitize(event.error.message) ?? '',
          stack: event.error.stack ? this.sanitizerService.sanitize(event.error.stack) ?? undefined : undefined,
        }
      : undefined;

    const sanitizedEvent = {
      ...event,
      error: sanitizedError,
      inputPreview: event.inputPreview
        ? this.sanitizerService.sanitize(event.inputPreview, { truncate: true }) ?? undefined
        : undefined,
      outputPreview: event.outputPreview
        ? this.sanitizerService.sanitize(event.outputPreview, { truncate: true }) ?? undefined
        : undefined,
    };

    // 2. Map and persist to Database
    const provider = PROVIDER_MAP[sanitizedEvent.provider];
    if (!provider) {
      throw new Error(`Unknown provider: ${sanitizedEvent.provider}`);
    }

    const status = STATUS_MAP[sanitizedEvent.status] ?? 'ERROR';

    await this.prisma.inferenceLog.create({
      data: {
        requestCorrelationId: envelope.correlationId,
        conversationId: sanitizedEvent.conversationId ?? null,
        sessionId: sanitizedEvent.sessionId,
        provider,
        model: sanitizedEvent.model,
        status,
        errorCode: sanitizedEvent.error?.code ?? null,
        errorMessage: sanitizedEvent.error?.message ?? null,
        latencyMs: sanitizedEvent.latencyMs,
        promptTokens: sanitizedEvent.tokenUsage?.promptTokens ?? null,
        completionTokens: sanitizedEvent.tokenUsage?.completionTokens ?? null,
        totalTokens: sanitizedEvent.tokenUsage?.totalTokens ?? null,
        fallbackFromProvider: sanitizedEvent.fallbackMetadata?.fallbackFromProvider
          ? PROVIDER_MAP[sanitizedEvent.fallbackMetadata.fallbackFromProvider] ?? null
          : null,
        fallbackFromModel: sanitizedEvent.fallbackMetadata?.fallbackFromModel ?? null,
        inputPreview: sanitizedEvent.inputPreview ?? null,
        outputPreview: sanitizedEvent.outputPreview ?? null,
      },
    });

    jobLogger.info(
      { provider, status },
      'inference.log.persisted',
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    const correlationId = (job.data as Record<string, unknown> | undefined)?.correlationId as string | undefined;
    this.logger.pino.debug(
      { jobId: job.id, correlationId },
      'job.completed',
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error): Promise<void> {
    const correlationId = (job.data as Record<string, unknown> | undefined)?.correlationId as string | undefined;
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
