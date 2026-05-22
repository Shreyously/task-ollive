import { Injectable } from '@nestjs/common';
import { generateText, streamText, type LanguageModelUsage } from 'ai';
import { groq } from '@ai-sdk/groq';

import type {
  LLMGenerateRequest,
  LLMProvider,
  LLMProviderResult,
  LLMUsage,
  ModelId,
} from '../provider.types.js';
import { normalizeProviderError } from '../provider.utils.js';

@Injectable()
export class GroqLlmProvider implements LLMProvider {
  readonly provider = 'groq' as const;
  readonly supportedModels: ModelId[] = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

  async generate(request: LLMGenerateRequest): Promise<LLMProviderResult> {
    const startedAt = Date.now();
    try {
      const result = await generateText({
        model: groq(request.model),
        prompt: request.prompt,
        temperature: request.temperature,
        maxTokens: request.maxOutputTokens,
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

  async stream(request: LLMGenerateRequest): Promise<AsyncIterable<string>> {
    try {
      const result = streamText({
        model: groq(request.model),
        prompt: request.prompt,
        temperature: request.temperature,
        maxTokens: request.maxOutputTokens,
      });

      // Use fullStream instead of textStream because textStream silently
      // swallows errors (yields 0 chunks), while fullStream surfaces them
      // as error events that we can re-throw to trigger provider fallback.
      return this.wrapFullStream(result.fullStream, request.model);
    } catch (error: unknown) {
      throw normalizeProviderError(error, this.provider, request.model);
    }
  }

  private async *wrapFullStream(
    fullStream: AsyncIterable<{ type: string; textDelta?: string; error?: unknown }>,
    model: ModelId,
  ): AsyncIterable<string> {
    for await (const part of fullStream) {
      if (part.type === 'text-delta' && part.textDelta) {
        yield part.textDelta;
      } else if (part.type === 'error') {
        throw normalizeProviderError(
          part.error ?? new Error('Stream error from provider'),
          this.provider,
          model,
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
