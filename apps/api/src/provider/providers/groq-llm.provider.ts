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
  readonly supportedModels: ModelId[] = ['llama-3.3-70b', 'gemma2-9b'];

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

      return result.textStream;
    } catch (error: unknown) {
      throw normalizeProviderError(error, this.provider, request.model);
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
