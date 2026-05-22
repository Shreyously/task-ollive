import type { InferenceProvider, InferenceStatus,PrismaClient } from '@prisma/client';
import type { InferenceEventEnvelope } from '@repo/inference-sdk';

import type { Logger } from './logger.js';

const PROVIDER_MAP: Record<string, InferenceProvider> = {
  google: 'GOOGLE',
  groq: 'GROQ',
};

const STATUS_MAP: Record<string, InferenceStatus> = {
  success: 'SUCCESS',
  error: 'ERROR',
  canceled: 'CANCELED',
};

export async function processInferenceEvent(
  envelope: InferenceEventEnvelope,
  prisma: PrismaClient,
  logger: Logger,
): Promise<void> {
  const event = envelope.payload;

  const provider = PROVIDER_MAP[event.provider];
  if (!provider) {
    throw new Error(`Unknown provider: ${event.provider}`);
  }

  const status = STATUS_MAP[event.status] ?? 'ERROR';

  await prisma.inferenceLog.create({
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

  logger.info(
    { correlationId: envelope.correlationId, provider, status },
    'inference.log.persisted',
  );
}
