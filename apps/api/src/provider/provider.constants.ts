import type { ModelId, ProviderId } from './provider.types.js';

export const MODEL_TO_PROVIDER: Record<ModelId, ProviderId> = {
  'gemini-2.0-flash': 'google',
  'llama-3.3-70b-versatile': 'groq',
  'llama-3.1-8b-instant': 'groq',
};

export const FALLBACK_MODEL: Record<ModelId, ModelId | null> = {
  'gemini-2.0-flash': 'llama-3.3-70b-versatile',
  'llama-3.3-70b-versatile': 'llama-3.1-8b-instant',
  'llama-3.1-8b-instant': null,
};
