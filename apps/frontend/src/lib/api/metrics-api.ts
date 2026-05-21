import type { DashboardSummary } from '../types';
import { apiClient } from './client';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  void apiClient.baseUrl;
  await new Promise((resolve) => setTimeout(resolve, 250));

  return {
    totalRequests: 1242,
    errorRate: 1.9,
    p95LatencyMs: 1280,
    avgTokens: 846,
  };
}
