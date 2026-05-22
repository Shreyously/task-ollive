import type { ModelId, ProviderId, QueueEnvelope } from '@repo/shared-types';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface FallbackMetadata {
  fallbackUsed: boolean;
  fallbackFromProvider?: ProviderId;
  fallbackFromModel?: ModelId;
}

export interface InferenceError {
  message: string;
  code?: string;
  stack?: string;
}

export interface InferenceEvent {
  requestId: string;
  conversationId?: string;
  provider: ProviderId;
  model: ModelId;
  latencyMs: number;
  tokenUsage?: TokenUsage;
  startedAt: string;
  completedAt: string;
  status: 'success' | 'error' | 'canceled';
  error?: InferenceError;
  inputPreview?: string;
  outputPreview?: string;
  fallbackMetadata?: FallbackMetadata;
}

export type InferenceEventEnvelope = QueueEnvelope<InferenceEvent>;

export type InferenceEventEmitter = (envelope: InferenceEventEnvelope) => void | Promise<void>;

export interface InferenceObserverConfig {
  onEmit: InferenceEventEmitter;
}

export interface InferenceContext {
  conversationId?: string;
  correlationId?: string;
  provider: ProviderId;
  model: ModelId;
  inputPreview?: string;
}
