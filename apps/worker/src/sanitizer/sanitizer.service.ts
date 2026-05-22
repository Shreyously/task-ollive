import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RedactorRule {
  name: string;
  pattern: RegExp;
  replacement: string;
}

@Injectable()
export class SanitizerService {
  private readonly rules: RedactorRule[];
  private readonly enabled: boolean;
  private readonly previewMaxLength: number;

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
    this.enabled = this.configService.get<boolean>('worker.redaction.enabled') ?? true;
    this.previewMaxLength = this.configService.get<number>('worker.redaction.previewMaxLength') ?? 1000;

    this.rules = [
      {
        name: 'email',
        // Standard email regex
        pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        replacement: '[REDACTED_EMAIL]',
      },
      {
        name: 'credit_card',
        // Matches typical credit card structures: 13 to 19 digits, possibly separated by spaces or dashes
        pattern: /\b(?:\d[ -]*?){13,19}\b/g,
        replacement: '[REDACTED_CC]',
      },
      {
        name: 'phone_number',
        // Matches typical international/domestic formats (e.g. +1-555-555-5555, (555) 555-5555, 555-555-5555)
        pattern: /\+?\b(?:\d{1,3}[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/g,
        replacement: '[REDACTED_PHONE]',
      },
    ];
  }

  /**
   * Redacts PII in the given string and optionally truncates it.
   * If PII redaction is disabled, it will still perform truncation if requested.
   */
  sanitize(text: string | null | undefined, options?: { truncate?: boolean }): string | null {
    if (text === null || text === undefined) {
      return null;
    }

    let sanitized = text;

    if (this.enabled) {
      for (const rule of this.rules) {
        sanitized = sanitized.replace(rule.pattern, rule.replacement);
      }
    }

    if (options?.truncate && sanitized.length > this.previewMaxLength) {
      sanitized = sanitized.substring(0, this.previewMaxLength) + '...';
    }

    return sanitized;
  }
}
