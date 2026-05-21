import type { ModelId, ProviderId } from './provider.types.js';

export function normalizeProviderError(error: unknown, provider: ProviderId, model: ModelId) {
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

  return {
    provider,
    model,
    message,
    code,
    statusCode,
    retryable: statusCode === undefined || statusCode >= 500 || code === 'ETIMEDOUT',
  };
}
