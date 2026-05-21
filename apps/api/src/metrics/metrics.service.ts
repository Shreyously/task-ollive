import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import type { MetricsQueryDto } from './dto/metrics-query.dto.js';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(query: MetricsQueryDto) {
    const provider = this.toProvider(query.provider);
    const where = {
      provider,
      model: query.model,
    };

    const [totalRequests, errorRequests] = await Promise.all([
      this.prisma.inferenceLog.count({ where }),
      this.prisma.inferenceLog.count({
        where: {
          ...where,
          status: 'ERROR',
        },
      }),
    ]);

    return {
      totalRequests,
      errorRequests,
      window: query.window ?? '24h',
    };
  }

  private toProvider(value?: string): 'GOOGLE' | 'GROQ' | undefined {
    if (!value) {
      return undefined;
    }

    if (value.toLowerCase() === 'google') {
      return 'GOOGLE';
    }

    if (value.toLowerCase() === 'groq') {
      return 'GROQ';
    }

    return undefined;
  }
}
