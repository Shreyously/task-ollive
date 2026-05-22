import { useState } from 'react';
import {
  Zap,
  Activity,
  AlertTriangle,
  Coins,
  RefreshCw,
  Cpu,
  Layers,
} from 'lucide-react';

import {
  useDashboardOverview,
  useDashboardUsage,
  useDashboardTrends,
} from '../hooks/use-dashboard-data';
import type { TimeWindow } from '../lib/types';
import { MetricCard } from '../components/dashboard/metric-card';
import { LatencyChart } from '../components/dashboard/latency-chart';
import { ThroughputChart } from '../components/dashboard/throughput-chart';
import { ProviderChart } from '../components/dashboard/provider-chart';
import { ModelUsageChart } from '../components/dashboard/model-usage-chart';
import { ChartSkeleton, Skeleton, ErrorState } from '../components/common/state';

export function DashboardPage() {
  const [window, setWindow] = useState<TimeWindow>('24h');

  // Fetch all metric sections
  const overviewQuery = useDashboardOverview(window);
  const usageQuery = useDashboardUsage(window);
  const trendsQuery = useDashboardTrends(window);

  // Check overall state
  const isLoading = overviewQuery.isLoading || usageQuery.isLoading || trendsQuery.isLoading;
  const isError = overviewQuery.isError || usageQuery.isError || trendsQuery.isError;
  const isFetching = overviewQuery.isFetching || usageQuery.isFetching || trendsQuery.isFetching;

  // Window labels helper
  const windowOptions: Array<{ value: TimeWindow; label: string }> = [
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
  ];

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <ErrorState label="Could not fetch latest observability metrics. Check if the server is running." />
      </div>
    );
  }

  const overview = overviewQuery.data;
  const usage = usageQuery.data;
  const trends = trendsQuery.data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-app-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Observability Dashboard</h1>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-1">Real-time LLM inference performance, costs, and health logs.</p>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          {/* Polling Indicator */}
          {isFetching && !isLoading && (
            <RefreshCw className="h-4 w-4 animate-spin text-slate-500" />
          )}

          {/* Segmented Control */}
          <div className="inline-flex rounded-lg bg-slate-900 border border-app-border p-1">
            {windowOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setWindow(opt.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                  window === opt.value
                    ? 'bg-slate-800 text-cyan-400 shadow-md border border-slate-700/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top row stats: loading skeleton or data */}
      {isLoading || !overview ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-app-border bg-app-panel p-5 space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Requests"
            value={overview.totalRequests.toLocaleString()}
            description={`${overview.requestsPerMinute.toFixed(2)} requests per minute`}
            icon={<Activity className="h-5 w-5" />}
          />
          <MetricCard
            label="Average Latency"
            value={`${Math.round(overview.averageLatencyMs)} ms`}
            description="Overall mean response time"
            icon={<Zap className="h-5 w-5 text-indigo-400" />}
            trend={overview.averageLatencyMs > 2000 ? 'High' : 'Healthy'}
            trendType={overview.averageLatencyMs > 2000 ? 'down' : 'up'}
          />
          <MetricCard
            label="Error Rate"
            value={`${overview.errorRate.toFixed(2)}%`}
            description={`${overview.errorRequests} total failed calls`}
            icon={<AlertTriangle className="h-5 w-5 text-rose-400" />}
            trend={overview.errorRate > 5 ? 'Critical' : 'Nominal'}
            trendType={overview.errorRate > 5 ? 'down' : 'up'}
          />
          <MetricCard
            label="Token Consumption"
            value={overview.tokenConsumption.totalTokens.toLocaleString()}
            description={`${overview.tokenConsumption.promptTokens.toLocaleString()} prompt / ${overview.tokenConsumption.completionTokens.toLocaleString()} completion`}
            icon={<Coins className="h-5 w-5 text-cyan-400" />}
          />
        </div>
      )}

      {/* Middle Grid: Latency & Throughput Trend Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {isLoading || !trends ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <LatencyChart data={trends.trends} window={window} />
            <ThroughputChart data={trends.trends} window={window} />
          </>
        )}
      </div>

      {/* Bottom Grid: Provider & Model Distribution Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {isLoading || !usage ? (
            <div className="rounded-xl border border-app-border bg-app-panel p-5 h-[340px] space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="flex justify-center items-center h-48">
                <div className="h-32 w-32 rounded-full border-8 border-slate-800 animate-pulse border-t-indigo-500/60" />
              </div>
            </div>
          ) : (
            <ProviderChart data={usage.byProvider} />
          )}
        </div>

        <div className="lg:col-span-2">
          {isLoading || !usage ? (
            <div className="rounded-xl border border-app-border bg-app-panel p-5 h-[340px] space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <div className="space-y-3 pt-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            </div>
          ) : (
            <ModelUsageChart data={usage.byModel} />
          )}
        </div>
      </div>
    </div>
  );
}
