import type { ModelId, ProviderId } from './provider.types.js';

export const MODEL_TO_PROVIDER: Record<ModelId, ProviderId> = {
  'gemini-2.0-flash': 'google',
  'llama-3.3-70b': 'groq',
  'gemma2-9b': 'groq',
};

export const FALLBACK_MODEL: Record<ModelId, ModelId | null> = {
  'gemini-2.0-flash': 'llama-3.3-70b',
  'llama-3.3-70b': 'gemma2-9b',
  'gemma2-9b': null,
};
