import { google } from '@ai-sdk/google';
import { Injectable } from '@nestjs/common';
import { generateText, type LanguageModelUsage,streamText } from 'ai';

import type {
  LLMGenerateRequest,
  LLMProvider,
  LLMProviderResult,
  LLMUsage,
  ModelId,
} from '../provider.types.js';
import { normalizeProviderError } from '../provider.utils.js';

@Injectable()
export class GoogleLlmProvider implements LLMProvider {
  readonly provider = 'google' as const;
  readonly supportedModels: ModelId[] = ['gemini-2.0-flash'];

  async generate(request: LLMGenerateRequest): Promise<LLMProviderResult> {
    const startedAt = Date.now();
    const timeoutMs = request.timeoutMs ?? 10000;
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const abortSignal = request.abortSignal
      ? AbortSignal.any([request.abortSignal, timeoutSignal])
      : timeoutSignal;

    try {
      const result = await generateText({
        model: google(request.model),
        prompt: request.prompt,
        temperature: request.temperature,
        maxTokens: request.maxOutputTokens,
        abortSignal,
      });

      return {
        provider: this.provider,
        model: request.model,
        text: result.text,
        usage: this.extractUsage(result.usage),
        latencyMs: Date.now() - startedAt,
        fallbackUsed: false,
      };
    } catch (error: unknown) {
      throw normalizeProviderError(error, this.provider, request.model);
    }
  }

  stream(request: LLMGenerateRequest): Promise<AsyncIterable<string>> {
    try {
      const timeoutMs = request.timeoutMs ?? 10000;
      const timeoutSignal = AbortSignal.timeout(timeoutMs);
      const abortSignal = request.abortSignal
        ? AbortSignal.any([request.abortSignal, timeoutSignal])
        : timeoutSignal;

      const result = streamText({
        model: google(request.model),
        prompt: request.prompt,
        temperature: request.temperature,
        maxTokens: request.maxOutputTokens,
        abortSignal,
      });

      // Use fullStream instead of textStream because textStream silently
      // swallows errors (yields 0 chunks), while fullStream surfaces them
      // as error events that we can re-throw to trigger provider fallback.
      return Promise.resolve(this.wrapFullStream(result.fullStream));
    } catch (error: unknown) {
      return Promise.reject(normalizeProviderError(error, this.provider, request.model));
    }
  }

  private async *wrapFullStream(
    fullStream: AsyncIterable<{ type: string; textDelta?: string; error?: unknown }>,
  ): AsyncIterable<string> {
    for await (const part of fullStream) {
      if (part.type === 'text-delta' && part.textDelta) {
        yield part.textDelta;
      } else if (part.type === 'error') {
        throw normalizeProviderError(
          part.error ?? new Error('Stream error from provider'),
          this.provider,
          'gemini-2.0-flash',
        );
      }
    }
  }

  extractUsage(usage: LanguageModelUsage | undefined): LLMUsage {
    if (!usage) return {};
    const usageRecord = usage as {
      inputTokens?: number;
      outputTokens?: number;
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
    return {
      promptTokens: usageRecord.inputTokens ?? usageRecord.promptTokens,
      completionTokens: usageRecord.outputTokens ?? usageRecord.completionTokens,
      totalTokens: usageRecord.totalTokens,
    };
  }
}
