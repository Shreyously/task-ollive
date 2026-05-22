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
    name?: string;
    message?: string;
    code?: string;
    statusCode?: number;
    status?: number;
    cause?: unknown;
  };

  const statusCode = err.statusCode ?? err.status;
  let code = typeof err.code === 'string' ? err.code : undefined;
  let message = err.message ?? 'Provider call failed';

  if (err.name === 'TimeoutError' || message.toLowerCase().includes('timeout') || err.name === 'AbortError' || message.toLowerCase().includes('aborted')) {
    code = 'ETIMEDOUT';
    message = `Provider request timed out or was aborted: ${message}`;
  }

  return new ProviderError(message, provider, model, code, statusCode);
}
