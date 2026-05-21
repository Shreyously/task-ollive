import { Injectable } from '@nestjs/common';
import { GoogleLlmProvider } from './providers/google-llm.provider.js';
import { GroqLlmProvider } from './providers/groq-llm.provider.js';

import type { ProviderSelectionDto } from './dto/provider-selection.dto.js';
import { FALLBACK_MODEL, MODEL_TO_PROVIDER } from './provider.constants.js';
import type {
  LLMGenerateRequest,
  LLMProvider,
  LLMProviderResult,
  LLMUsage,
  ModelId,
  ProviderId,
} from './provider.types.js';

@Injectable()
export class ProviderService {
  private readonly providersById: Record<ProviderId, LLMProvider>;

  constructor(
    private readonly googleProvider: GoogleLlmProvider,
    private readonly groqProvider: GroqLlmProvider,
  ) {
    this.providersById = {
      google: this.googleProvider,
      groq: this.groqProvider,
    };
  }

  describeSelection(selection: ProviderSelectionDto) {
    return {
      provider: selection.provider,
      model: selection.model,
      ready: true,
      note: 'Provider abstraction is active.',
    };
  }

  async generate(request: LLMGenerateRequest): Promise<LLMProviderResult> {
    const provider = this.resolveProviderForModel(request.model);
    try {
      return await provider.generate(request);
    } catch (primaryError) {
      if (request.disableFallback) throw primaryError;
      const fallbackModel = FALLBACK_MODEL[request.model];
      if (!fallbackModel) throw primaryError;
      const fallbackProvider = this.resolveProviderForModel(fallbackModel);
      const fallbackResult = await fallbackProvider.generate({
        ...request,
        model: fallbackModel,
      });

      return {
        ...fallbackResult,
        fallbackUsed: true,
        fallbackFromProvider: provider.provider,
        fallbackFromModel: request.model,
      };
    }
  }

  async stream(request: LLMGenerateRequest): Promise<AsyncIterable<string>> {
    const provider = this.resolveProviderForModel(request.model);
    try {
      return await provider.stream(request);
    } catch (primaryError) {
      if (request.disableFallback) throw primaryError;
      const fallbackModel = FALLBACK_MODEL[request.model];
      if (!fallbackModel) throw primaryError;
      const fallbackProvider = this.resolveProviderForModel(fallbackModel);
      return fallbackProvider.stream({ ...request, model: fallbackModel });
    }
  }

  extractUsage(providerId: ProviderId, usage: unknown): LLMUsage {
    const provider = this.providersById[providerId];
    return provider.extractUsage(usage as never);
  }

  private resolveProviderForModel(model: ModelId): LLMProvider {
    const providerId = MODEL_TO_PROVIDER[model];
    return this.providersById[providerId];
  }
}
