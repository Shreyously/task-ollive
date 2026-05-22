import { randomUUID } from 'node:crypto';

import type { FallbackMetadata, InferenceContext, InferenceEvent, InferenceEventEnvelope, InferenceObserverConfig, TokenUsage } from './types.js';

export class InferenceObserver {
  private readonly onEmit: (envelope: InferenceEventEnvelope) => void | Promise<void>;

  constructor(config: InferenceObserverConfig) {
    this.onEmit = config.onEmit;
  }

  private createEnvelope(
    payload: InferenceEvent,
    correlationId: string,
  ): InferenceEventEnvelope {
    return {
      correlationId,
      createdAt: new Date().toISOString(),
      payload,
      version: 'v1',
    };
  }

  /**
   * Wraps a standard promise-based inference call.
   */
  async wrap<T>(
    context: InferenceContext,
    executor: () => Promise<T>,
    options?: {
      extractResult?: (result: T) => {
        outputPreview?: string;
        tokenUsage?: TokenUsage;
        fallbackMetadata?: FallbackMetadata;
      };
    },
  ): Promise<T> {
    const requestId = randomUUID();
    const correlationId = context.correlationId ?? randomUUID();
    const startedAt = new Date().toISOString();
    const startTime = performance.now();

    try {
      const result = await executor();
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);
      const completedAt = new Date().toISOString();

      const extracted = options?.extractResult ? options.extractResult(result) : undefined;

      const event: InferenceEvent = {
        requestId,
        conversationId: context.conversationId,
        sessionId: context.sessionId,
        provider: context.provider,
        model: context.model,
        latencyMs,
        tokenUsage: extracted?.tokenUsage,
        startedAt,
        completedAt,
        status: 'success',
        inputPreview: context.inputPreview,
        outputPreview: extracted?.outputPreview,
        fallbackMetadata: extracted?.fallbackMetadata,
      };

      await this.safeEmit(this.createEnvelope(event, correlationId));
      return result;
    } catch (err: unknown) {
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);
      const completedAt = new Date().toISOString();

      const errorObject = err as Record<string, unknown> & { message?: string; code?: string; stack?: string };

      const event: InferenceEvent = {
        requestId,
        conversationId: context.conversationId,
        sessionId: context.sessionId,
        provider: context.provider,
        model: context.model,
        latencyMs,
        startedAt,
        completedAt,
        status: 'error',
        inputPreview: context.inputPreview,
        error: {
          message: errorObject?.message ?? (err instanceof Error ? err.message : 'Unknown error'),
          code: typeof errorObject?.code === 'string' ? errorObject.code : undefined,
          stack: typeof errorObject?.stack === 'string' ? errorObject.stack : undefined,
        },
      };

      await this.safeEmit(this.createEnvelope(event, correlationId));
      throw err;
    }
  }

  /**
   * Wraps a streaming inference call, returning a new AsyncIterable.
   * Leverages the iterator protocol to accurately capture completion, errors, and cancellation.
   */
  async wrapStream(
    context: InferenceContext,
    executor: () => Promise<AsyncIterable<string>>,
    options?: {
      onComplete?: (accumulatedText: string) => {
        tokenUsage?: TokenUsage;
        fallbackMetadata?: FallbackMetadata;
      };
    },
  ): Promise<AsyncIterable<string>> {
    const requestId = randomUUID();
    const correlationId = context.correlationId ?? randomUUID();
    const startedAt = new Date().toISOString();
    const startTime = performance.now();

    try {
      const stream = await executor();

      return {
        [Symbol.asyncIterator]: () => {
          const iterator = stream[Symbol.asyncIterator]();
          let accumulatedText = '';
          let status: 'success' | 'error' | 'canceled' = 'success';
          let streamError: unknown = undefined;
          let isFinalized = false;

          const finalize = async (finalStatus: 'success' | 'error' | 'canceled') => {
            if (isFinalized) return;
            isFinalized = true;
            status = finalStatus;

            const endTime = performance.now();
            const latencyMs = Math.round(endTime - startTime);
            const completedAt = new Date().toISOString();

            const completionDetails = status === 'success' && options?.onComplete
              ? options.onComplete(accumulatedText)
              : undefined;

            const errorObject = streamError as Record<string, unknown> & { message?: string; code?: string; stack?: string };

            const event: InferenceEvent = {
              requestId,
              conversationId: context.conversationId,
              sessionId: context.sessionId,
              provider: context.provider,
              model: context.model,
              latencyMs,
              tokenUsage: completionDetails?.tokenUsage,
              startedAt,
              completedAt,
              status,
              inputPreview: context.inputPreview,
              outputPreview: accumulatedText || undefined,
              fallbackMetadata: completionDetails?.fallbackMetadata,
              ...(streamError ? {
                error: {
                  message: errorObject?.message ?? (streamError instanceof Error ? streamError.message : 'Unknown stream error'),
                  code: typeof errorObject?.code === 'string' ? errorObject.code : undefined,
                  stack: typeof errorObject?.stack === 'string' ? errorObject.stack : undefined,
                },
              } : {}),
            };

            await this.safeEmit(this.createEnvelope(event, correlationId));
          };

          return {
            async next() {
              try {
                const nextResult = await iterator.next();
                if (nextResult.done) {
                  await finalize('success');
                } else {
                  accumulatedText += nextResult.value;
                }
                return nextResult;
              } catch (err: unknown) {
                streamError = err;
                await finalize('error');
                throw err;
              }
            },
            async return(value?: unknown) {
              await finalize('canceled');
              if (typeof iterator.return === 'function') {
                return await iterator.return(value);
              }
              return { done: true, value };
            },
            async throw(err?: unknown) {
              streamError = err;
              await finalize('error');
              if (typeof iterator.throw === 'function') {
                return await iterator.throw(err);
              }
              throw err;
            },
          };
        },
      };
    } catch (err: unknown) {
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);
      const completedAt = new Date().toISOString();

      const errorObject = err as Record<string, unknown> & { message?: string; code?: string; stack?: string };

      const event: InferenceEvent = {
        requestId,
        conversationId: context.conversationId,
        sessionId: context.sessionId,
        provider: context.provider,
        model: context.model,
        latencyMs,
        startedAt,
        completedAt,
        status: 'error',
        inputPreview: context.inputPreview,
        error: {
          message: errorObject?.message ?? (err instanceof Error ? err.message : 'Unknown error'),
          code: typeof errorObject?.code === 'string' ? errorObject.code : undefined,
          stack: typeof errorObject?.stack === 'string' ? errorObject.stack : undefined,
        },
      };

      await this.safeEmit(this.createEnvelope(event, correlationId));
      throw err;
    }
  }

  private async safeEmit(envelope: InferenceEventEnvelope): Promise<void> {
    try {
      await this.onEmit(envelope);
    } catch (emitError) {
      // Prevent observability emission failures from crashing the primary execution flow
      console.error('Failed to emit inference event:', emitError);
    }
  }
}
