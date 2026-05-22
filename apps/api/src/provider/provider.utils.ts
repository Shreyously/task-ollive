import type { ModelId, ProviderId } from './provider.types.js';

export class ProviderError extends Error {
  provider: ProviderId;
  model: ModelId;
  code?: string;
  statusCode?: number;
  retryable: boolean;

  constructor(
    message: string,
    provider: ProviderId,
    model: ModelId,
    code?: string,
    statusCode?: number,
  ) {
    super(message);
    this.name = 'ProviderError';
    this.provider = provider;
    this.model = model;
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = statusCode === undefined || statusCode >= 500 || code === 'ETIMEDOUT';
  }
}

export function normalizeProviderError(error: unknown, provider: ProviderId, model: ModelId): ProviderError {
  const err = error as {
    message?: string;
    code?: string;
    statusCode?: number;
    status?: number;
    cause?: unknown;
  };

  const statusCode = err.statusCode ?? err.status;
  const code = typeof err.code === 'string' ? err.code : undefined;
  const message = err.message ?? 'Provider call failed';

  return new ProviderError(message, provider, model, code, statusCode);
}
