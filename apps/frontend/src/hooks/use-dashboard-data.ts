import { useQuery } from '@tanstack/react-query';

import { getDashboardSummary } from '../lib/api/metrics-api';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: getDashboardSummary,
  });
}
