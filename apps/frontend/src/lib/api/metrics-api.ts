import type { DashboardOverview, DashboardUsage, DashboardTrends, TimeWindow } from '../types';
import { apiClient } from './client';


export async function getDashboardOverview(window: TimeWindow): Promise<DashboardOverview> {
  return apiClient.request<DashboardOverview>(`/metrics/overview?window=${window}`);
}

export async function getDashboardUsage(window: TimeWindow): Promise<DashboardUsage> {
  return apiClient.request<DashboardUsage>(`/metrics/usage?window=${window}`);
}

export async function getDashboardTrends(window: TimeWindow): Promise<DashboardTrends> {
  return apiClient.request<DashboardTrends>(`/metrics/trends?window=${window}`);
}
