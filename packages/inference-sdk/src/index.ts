import type { ModelId, ProviderId, QueueEnvelope } from '@repo/shared-types';

export interface InferenceEvent {
  model: ModelId;
  provider: ProviderId;
  requestId: string;
}

export type InferenceEventEnvelope = QueueEnvelope<InferenceEvent>;
