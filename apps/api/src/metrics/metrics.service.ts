import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import type { MetricsQueryDto } from './dto/metrics-query.dto.js';

@Injectable()
export class MetricsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async summary(query: MetricsQueryDto) {
    const startDate = this.getStartDate(query.window);
    const provider = this.toProvider(query.provider);
    const where: Prisma.InferenceLogWhereInput = {
      createdAt: { gte: startDate },
    };

    if (provider) {
      where.provider = provider;
    }
    if (query.model) {
      where.model = query.model;
    }

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

  async overview(query: MetricsQueryDto) {
    const startDate = this.getStartDate(query.window);
    const provider = this.toProvider(query.provider);
    const where: Prisma.InferenceLogWhereInput = {
      createdAt: { gte: startDate },
    };

    if (provider) {
      where.provider = provider;
    }
    if (query.model) {
      where.model = query.model;
    }

    const [aggregate, errorRequests] = await Promise.all([
      this.prisma.inferenceLog.aggregate({
        _count: { id: true },
        _avg: { latencyMs: true },
        _sum: {
          promptTokens: true,
          completionTokens: true,
          totalTokens: true,
        },
        where,
      }),
      this.prisma.inferenceLog.count({
        where: {
          ...where,
          status: 'ERROR',
        },
      }),
    ]);

    const totalRequests = aggregate._count.id || 0;
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    const averageLatency = aggregate._avg.latencyMs || 0;

    const minutes = this.getWindowMinutes(query.window);
    const requestsPerMinute = totalRequests / minutes;

    return {
      totalRequests,
      errorRequests,
      errorRate,
      averageLatencyMs: averageLatency,
      requestsPerMinute,
      tokenConsumption: {
        promptTokens: aggregate._sum.promptTokens || 0,
        completionTokens: aggregate._sum.completionTokens || 0,
        totalTokens: aggregate._sum.totalTokens || 0,
      },
      window: query.window ?? '24h',
    };
  }

  async usage(query: MetricsQueryDto) {
    const startDate = this.getStartDate(query.window);
    const provider = this.toProvider(query.provider);
    const where: Prisma.InferenceLogWhereInput = {
      createdAt: { gte: startDate },
    };

    if (provider) {
      where.provider = provider;
    }
    if (query.model) {
      where.model = query.model;
    }

    const [providerUsage, modelUsage] = await Promise.all([
      this.prisma.inferenceLog.groupBy({
        by: ['provider'],
        _count: { id: true },
        _avg: { latencyMs: true },
        where,
      }),
      this.prisma.inferenceLog.groupBy({
        by: ['model'],
        _count: { id: true },
        _avg: { latencyMs: true },
        where,
      }),
    ]);

    return {
      byProvider: providerUsage.map((p) => ({
        provider: p.provider,
        count: p._count.id,
        avgLatencyMs: p._avg.latencyMs || 0,
      })),
      byModel: modelUsage.map((m) => ({
        model: m.model,
        count: m._count.id,
        avgLatencyMs: m._avg.latencyMs || 0,
      })),
      window: query.window ?? '24h',
    };
  }

  async trends(query: MetricsQueryDto) {
    const startDate = this.getStartDate(query.window);
    const provider = this.toProvider(query.provider);
    const model = query.model;

    let interval = 'hour';
    if (query.window === '1h') {
      interval = 'minute';
    } else if (query.window === '7d' || query.window === '30d') {
      interval = 'day';
    }

    const conditions: Prisma.Sql[] = [Prisma.sql`"createdAt" >= ${startDate}`];

    if (provider) {
      conditions.push(Prisma.sql`"provider" = ${provider}::"InferenceProvider"`);
    }
    if (model) {
      conditions.push(Prisma.sql`"model" = ${model}`);
    }

    const whereClause = Prisma.join(conditions, ' AND ');

    // interval is checked and mapped to safe literals 'minute', 'hour', 'day' above.
    const queryStr = Prisma.sql`
      SELECT
        date_trunc(${interval}, "createdAt") as "timestamp",
        COUNT(id)::int as "requestCount",
        SUM(CASE WHEN "status" = 'ERROR' THEN 1 ELSE 0 END)::int as "errorCount",
        AVG("latencyMs")::float as "avgLatencyMs",
        SUM(COALESCE("totalTokens", 0))::int as "totalTokens"
      FROM "InferenceLog"
      WHERE ${whereClause}
      GROUP BY "timestamp"
      ORDER BY "timestamp" ASC
    `;

    const trends = await this.prisma.$queryRaw<
      Array<{
        timestamp: Date;
        requestCount: number;
        errorCount: number;
        avgLatencyMs: number;
        totalTokens: number;
      }>
    >(queryStr);

    return {
      trends: trends.map((t) => ({
        timestamp: t.timestamp,
        requestCount: Number(t.requestCount),
        errorCount: Number(t.errorCount),
        avgLatencyMs: Number(t.avgLatencyMs || 0),
        totalTokens: Number(t.totalTokens || 0),
        errorRate: t.requestCount > 0 ? (t.errorCount / t.requestCount) * 100 : 0,
      })),
      window: query.window ?? '24h',
    };
  }

  private getStartDate(window?: '1h' | '24h' | '7d' | '30d'): Date {
    const now = new Date();
    switch (window) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '24h':
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  private getWindowMinutes(window?: '1h' | '24h' | '7d' | '30d'): number {
    switch (window) {
      case '1h':
        return 60;
      case '7d':
        return 7 * 24 * 60;
      case '30d':
        return 30 * 24 * 60;
      case '24h':
      default:
        return 24 * 60;
    }
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

