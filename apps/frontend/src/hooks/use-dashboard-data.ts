import { useQuery } from '@tanstack/react-query';

import {
  getDashboardOverview,
  getDashboardUsage,
  getDashboardTrends,
} from '../lib/api/metrics-api';
import type { TimeWindow } from '../lib/types';

const LIVE_REFRESH_INTERVAL = 10000; // 10 seconds polling for live refresh

export function useDashboardOverview(window: TimeWindow) {
  return useQuery({
    queryKey: ['dashboard', 'overview', window],
    queryFn: () => getDashboardOverview(window),
    refetchInterval: LIVE_REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });
}

export function useDashboardUsage(window: TimeWindow) {
  return useQuery({
    queryKey: ['dashboard', 'usage', window],
    queryFn: () => getDashboardUsage(window),
    refetchInterval: LIVE_REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });
}

export function useDashboardTrends(window: TimeWindow) {
  return useQuery({
    queryKey: ['dashboard', 'trends', window],
    queryFn: () => getDashboardTrends(window),
    refetchInterval: LIVE_REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });
}
