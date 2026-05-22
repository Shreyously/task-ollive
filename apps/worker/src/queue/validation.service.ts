import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { InferenceEventEnvelopeDto } from './dto/inference-event.dto.js';

@Injectable()
export class ValidationService {
  async validate(data: unknown): Promise<InferenceEventEnvelopeDto> {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException('Invalid payload: must be a non-null object');
    }

    const instance = plainToInstance(InferenceEventEnvelopeDto, data);
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = errors
        .map((err) => {
          const constraints = err.constraints
            ? Object.values(err.constraints).join(', ')
            : '';
          const children = err.children
            ? err.children
                .map((c) => {
                  const subConstraints = c.constraints
                    ? Object.values(c.constraints).join(', ')
                    : '';
                  return `${c.property}: ${subConstraints}`;
                })
                .join('; ')
            : '';
          return `${err.property}: ${constraints}${children ? ` (${children})` : ''}`;
        })
        .join(' | ');

      throw new BadRequestException(`Validation failed: ${messages}`);
    }

    return instance;
  }
}
