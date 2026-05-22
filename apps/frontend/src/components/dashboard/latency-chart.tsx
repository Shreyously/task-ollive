import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardTrendItem, TimeWindow } from '../../lib/types';

interface LatencyChartProps {
  data: DashboardTrendItem[];
  window: TimeWindow;
}

export function LatencyChart({ data, window }: LatencyChartProps) {
  const formatXAxis = (tick: string) => {
    try {
      const date = new Date(tick);
      if (isNaN(date.getTime())) return tick;

      if (window === '1h') {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (window === '24h') {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return tick;
    }
  };

  const formatTooltipDate = (value: any) => {
    try {
      const date = new Date(String(value));
      if (isNaN(date.getTime())) return String(value);
      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(value);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-app-border bg-app-panel text-slate-400">
        No latency trend data available
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-app-border bg-app-panel p-5 shadow-lg shadow-black/10">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-100">Latency Trends</h3>
        <p className="text-xs text-slate-400">Average request processing time (ms) over time</p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="latencyGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}ms`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#1e293b',
                borderRadius: '8px',
                color: '#f8fafc',
              }}
              labelClassName="text-slate-400 font-medium text-xs mb-1"
              labelFormatter={formatTooltipDate}
              formatter={(value: any) => [`${Math.round(Number(value))} ms`, 'Avg Latency']}
            />
            <Area
              type="monotone"
              dataKey="avgLatencyMs"
              stroke="#a78bfa"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#latencyGlow)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
