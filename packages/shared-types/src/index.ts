export type ProviderId = 'google' | 'groq';

export type ModelId = 'gemini-2.0-flash' | 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant';

export interface QueueEnvelope<TPayload> {
  correlationId: string;
  createdAt: string;
  payload: TPayload;
  version: 'v1';
}

