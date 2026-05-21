import { Injectable } from '@nestjs/common';
import { generateText, streamText, type LanguageModelUsage } from 'ai';
import { google } from '@ai-sdk/google';

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
    try {
      const result = await generateText({
        model: google(request.model),
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
        model: google(request.model),
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
