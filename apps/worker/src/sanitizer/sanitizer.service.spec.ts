import assert from 'node:assert';
import test from 'node:test';

import type { ConfigService } from '@nestjs/config';

import { SanitizerService } from './sanitizer.service.js';

// Mock ConfigService
const mockConfigServiceEnabled = {
  get: (key: string) => {
    if (key === 'worker.redaction.enabled') return true;
    if (key === 'worker.redaction.previewMaxLength') return 20;
    return undefined;
  },
} as unknown as ConfigService;

const mockConfigServiceDisabled = {
  get: (key: string) => {
    if (key === 'worker.redaction.enabled') return false;
    if (key === 'worker.redaction.previewMaxLength') return 20;
    return undefined;
  },
} as unknown as ConfigService;

void test('SanitizerService - Enabled Redaction', async (t) => {
  const sanitizer = new SanitizerService(mockConfigServiceEnabled);

  await t.test('should redact emails', () => {
    const input = 'Contact us at support@example.com or sales.dept@company.co.uk for help.';
    const result = sanitizer.sanitize(input);
    assert.strictEqual(
      result,
      'Contact us at [REDACTED_EMAIL] or [REDACTED_EMAIL] for help.'
    );
  });

  await t.test('should redact phone numbers', () => {
    const input = 'Call +1 (555) 019-2834 or dial 555-555-5555 directly.';
    const result = sanitizer.sanitize(input);
    assert.strictEqual(
      result,
      'Call [REDACTED_PHONE] or dial [REDACTED_PHONE] directly.'
    );
  });

  await t.test('should redact credit cards', () => {
    const inputs = [
      'My card is 1234-5678-9012-3456.',
      'My card is 1234 5678 9012 3456.',
      'My card is 1234567890123456.'
    ];
    for (const input of inputs) {
      const result = sanitizer.sanitize(input);
      assert.strictEqual(result, 'My card is [REDACTED_CC].');
    }
  });

  await t.test('should support truncation when truncate option is true', () => {
    const input = 'This is a relatively long preview text that should exceed the configured max limit.';
    const result = sanitizer.sanitize(input, { truncate: true });
    assert.strictEqual(result, 'This is a relatively...');
  });

  await t.test('should not truncate when truncate option is false or omitted', () => {
    const input = 'This is a relatively long preview text that should exceed the configured max limit.';
    const result = sanitizer.sanitize(input);
    assert.strictEqual(result, input);
  });

  await t.test('should preserve non-PII and normal formatting', () => {
    const input = 'The server responded in 150ms with status code 200.';
    const result = sanitizer.sanitize(input);
    assert.strictEqual(result, input);
  });
});

void test('SanitizerService - Disabled Redaction', async (t) => {
  const sanitizer = new SanitizerService(mockConfigServiceDisabled);

  await t.test('should not redact PII but still respect truncation', () => {
    const input = 'User email is test@example.com and phone is 555-555-5555.';
    // No truncation
    const resultNoTrunc = sanitizer.sanitize(input);
    assert.strictEqual(resultNoTrunc, input);

    // Truncated (limit 20)
    const resultTrunc = sanitizer.sanitize(input, { truncate: true });
    assert.strictEqual(resultTrunc, 'User email is test@e...');
  });
});
