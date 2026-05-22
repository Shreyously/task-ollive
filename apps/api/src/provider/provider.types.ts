import type { LanguageModelUsage } from 'ai';

export type ProviderId = 'google' | 'groq';
export type ModelId = 'gemini-2.0-flash' | 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant';

export interface LLMGenerateRequest {
  model: ModelId;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  correlationId?: string;
  disableFallback?: boolean;
  timeoutMs?: number;
  abortSignal?: AbortSignal;
}

export interface LLMUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface LLMProviderResult {
  provider: ProviderId;
  model: ModelId;
  text: string;
  usage: LLMUsage;
  latencyMs: number;
  fallbackUsed: boolean;
  fallbackFromProvider?: ProviderId;
  fallbackFromModel?: ModelId;
}

export interface LLMProviderError {
  provider: ProviderId;
  model: ModelId;
  message: string;
  code?: string;
  statusCode?: number;
  retryable: boolean;
}

export interface LLMProvider {
  readonly provider: ProviderId;
  readonly supportedModels: ModelId[];
  generate(request: LLMGenerateRequest): Promise<LLMProviderResult>;
  stream(request: LLMGenerateRequest): Promise<AsyncIterable<string>>;
  extractUsage(usage: LanguageModelUsage | undefined): LLMUsage;
}
