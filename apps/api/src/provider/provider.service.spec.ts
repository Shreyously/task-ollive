import assert from 'node:assert';
import test from 'node:test';

import type { ProviderId } from './provider.types.js';
import { ProviderService } from './provider.service.js';

type StubResult = {
  provider: ProviderId;
  model: 'gemini-2.0-flash' | 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant';
  text: string;
  usage: {};
  latencyMs: number;
  fallbackUsed: boolean;
};

function createLoggerStub() {
  return {
    withContext() {
      return {
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
      };
    },
  };
}

void test('ProviderService.generate uses fallback when primary fails', async () => {
  const google = {
    provider: 'google' as const,
    supportedModels: ['gemini-2.0-flash'] as const,
    async generate() {
      throw new Error('google failed');
    },
    async stream() {
      throw new Error('unreachable');
    },
    extractUsage() {
      return {};
    },
  };

  const groq = {
    provider: 'groq' as const,
    supportedModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] as const,
    async generate(request: { model: StubResult['model'] }) {
      return {
        provider: 'groq',
        model: request.model,
        text: 'ok',
        usage: {},
        latencyMs: 1,
        fallbackUsed: false,
      } satisfies StubResult;
    },
    async stream() {
      throw new Error('unreachable');
    },
    extractUsage() {
      return {};
    },
  };

  const service = new ProviderService(
    google as never,
    groq as never,
    createLoggerStub() as never,
  );

  const result = await service.generate({
    model: 'gemini-2.0-flash',
    prompt: 'hello',
  });

  assert.equal(result.provider, 'groq');
  assert.equal(result.model, 'llama-3.3-70b-versatile');
  assert.equal(result.fallbackUsed, true);
  assert.equal(result.fallbackFromProvider, 'google');
  assert.equal(result.fallbackFromModel, 'gemini-2.0-flash');
});

void test('ProviderService.stream falls back when primary stream is empty', async () => {
  const google = {
    provider: 'google' as const,
    supportedModels: ['gemini-2.0-flash'] as const,
    async generate() {
      throw new Error('unreachable');
    },
    async stream() {
      return (async function* () {
        return;
      })();
    },
    extractUsage() {
      return {};
    },
  };

  const groq = {
    provider: 'groq' as const,
    supportedModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] as const,
    async generate() {
      throw new Error('unreachable');
    },
    async stream() {
      return (async function* () {
        yield 'fallback-token';
      })();
    },
    extractUsage() {
      return {};
    },
  };

  const service = new ProviderService(
    google as never,
    groq as never,
    createLoggerStub() as never,
  );

  const stream = await service.stream({
    model: 'gemini-2.0-flash',
    prompt: 'hello',
  });
  const chunks: string[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  assert.deepEqual(chunks, ['fallback-token']);
});

void test('ProviderService.stream throws when disableFallback=true and primary fails', async () => {
  const google = {
    provider: 'google' as const,
    supportedModels: ['gemini-2.0-flash'] as const,
    async generate() {
      throw new Error('unreachable');
    },
    async stream() {
      throw new Error('primary failed');
    },
    extractUsage() {
      return {};
    },
  };

  const groq = {
    provider: 'groq' as const,
    supportedModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] as const,
    async generate() {
      throw new Error('unreachable');
    },
    async stream() {
      return (async function* () {
        yield 'should not reach';
      })();
    },
    extractUsage() {
      return {};
    },
  };

  const service = new ProviderService(
    google as never,
    groq as never,
    createLoggerStub() as never,
  );

  await assert.rejects(
    service.stream({
      model: 'gemini-2.0-flash',
      prompt: 'hello',
      disableFallback: true,
    }),
    /primary failed/,
  );
});
