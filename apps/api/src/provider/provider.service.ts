import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
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
    @Inject(GoogleLlmProvider)
    private readonly googleProvider: GoogleLlmProvider,
    @Inject(GroqLlmProvider)
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
      const primaryStream = await provider.stream(request);
      // Attempt to read the first chunk to verify the stream is actually working.
      // Errors from Vercel AI SDK's streamText only surface during async iteration,
      // not from the initial call, so we must try iterating before committing.
      const iterator = primaryStream[Symbol.asyncIterator]();
      const first = await iterator.next();

      if (first.done) {
        // Stream completed without any text — treat as a failure
        throw new Error('Primary provider returned empty stream');
      }

      // Stream is healthy — yield the first chunk then continue
      return this.prependChunk(first.value, iterator);
    } catch (primaryError) {
      if (request.disableFallback) throw primaryError;
      const fallbackModel = FALLBACK_MODEL[request.model];
      if (!fallbackModel) throw primaryError;
      const fallbackProvider = this.resolveProviderForModel(fallbackModel);
      return fallbackProvider.stream({ ...request, model: fallbackModel });
    }
  }

  private async *prependChunk(
    firstChunk: string,
    iterator: AsyncIterator<string>,
  ): AsyncIterable<string> {
    yield firstChunk;
    while (true) {
      const next = await iterator.next();
      if (next.done) break;
      yield next.value;
    }
  }

  extractUsage(providerId: ProviderId, usage: unknown): LLMUsage {
    const provider = this.providersById[providerId];
    if (!provider) {
      throw new InternalServerErrorException(`Provider not registered: ${providerId}`);
    }
    return provider.extractUsage(usage as never);
  }

  private resolveProviderForModel(model: ModelId): LLMProvider {
    const providerId = MODEL_TO_PROVIDER[model];
    const provider = this.providersById[providerId];
    if (!provider) {
      throw new InternalServerErrorException(
        `No provider registered for model ${model} (expected provider: ${providerId})`,
      );
    }

    return provider;
  }
}
