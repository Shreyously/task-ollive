import { ErrorState, LoadingState } from '../components/common/state';
import { MetricCard } from '../components/dashboard/metric-card';
import { useDashboardSummary } from '../hooks/use-dashboard-data';

export function DashboardPage() {
  const summaryQuery = useDashboardSummary();

  if (summaryQuery.isLoading) return <LoadingState label="Loading dashboard..." />;
  if (summaryQuery.error || !summaryQuery.data) return <ErrorState label="Unable to load dashboard metrics." />;

  const data = summaryQuery.data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Requests" value={data.totalRequests.toLocaleString()} />
        <MetricCard label="Error Rate" value={`${data.errorRate.toFixed(1)}%`} />
        <MetricCard label="P95 Latency" value={`${data.p95LatencyMs} ms`} />
        <MetricCard label="Avg Tokens" value={`${data.avgTokens}`} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-app-border bg-app-panel p-4">
          <h2 className="text-sm font-semibold text-slate-200">Throughput Over Time</h2>
          <div className="mt-4 h-48 rounded-md border border-dashed border-slate-700 bg-slate-900/70" />
        </div>
        <div className="rounded-lg border border-app-border bg-app-panel p-4">
          <h2 className="text-sm font-semibold text-slate-200">Errors by Provider</h2>
          <div className="mt-4 h-48 rounded-md border border-dashed border-slate-700 bg-slate-900/70" />
        </div>
      </div>
    </div>
  );
}
