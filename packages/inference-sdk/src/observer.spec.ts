import assert from 'node:assert';
import test from 'node:test';

import { InferenceObserver } from './observer.js';
import type { InferenceEventEnvelope } from './types.js';

void test('InferenceObserver.wrap keeps provider/model attribution from context', async () => {
  const emitted: InferenceEventEnvelope[] = [];
  const observer = new InferenceObserver({
    onEmit: async (event) => {
      emitted.push(event);
    },
  });

  await observer.wrap(
    {
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      sessionId: 'sess-1',
      correlationId: 'corr-1',
      conversationId: 'conv-1',
      inputPreview: 'hello',
    },
    async () => ({ text: 'ok' }),
    {
      extractResult: () => ({
        outputPreview: 'ok',
        fallbackMetadata: {
          fallbackUsed: true,
          fallbackFromProvider: 'google',
          fallbackFromModel: 'gemini-2.0-flash',
        },
      }),
    },
  );

  assert.equal(emitted.length, 1);
  assert.equal(emitted[0]!.payload.provider, 'groq');
  assert.equal(emitted[0]!.payload.model, 'llama-3.3-70b-versatile');
  assert.equal(emitted[0]!.payload.fallbackMetadata?.fallbackUsed, true);
});

void test('InferenceObserver.wrapStream emits canceled on early return', async () => {
  const emitted: InferenceEventEnvelope[] = [];
  const observer = new InferenceObserver({
    onEmit: async (event) => {
      emitted.push(event);
    },
  });

  const wrapped = await observer.wrapStream(
    {
      provider: 'google',
      model: 'gemini-2.0-flash',
      sessionId: 'sess-2',
      correlationId: 'corr-2',
      conversationId: 'conv-2',
    },
    async () =>
      (async function* () {
        yield 'a';
        yield 'b';
      })(),
  );

  for await (const _chunk of wrapped) {
    break;
  }

  assert.equal(emitted.length, 1);
  assert.equal(emitted[0]!.payload.status, 'canceled');
});
