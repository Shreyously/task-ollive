import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardTrendItem, TimeWindow } from '../../lib/types';

interface ThroughputChartProps {
  data: DashboardTrendItem[];
  window: TimeWindow;
}

export function ThroughputChart({ data, window }: ThroughputChartProps) {
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
        No throughput trend data available
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-app-border bg-app-panel p-5 shadow-lg shadow-black/10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-100">Throughput & Errors</h3>
          <p className="text-xs text-slate-400">Volume of requests and encountered errors over time</p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
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
              tickFormatter={(v) => `${v}`}
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
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
            />
            <Bar
              dataKey="requestCount"
              name="Success"
              stackId="a"
              fill="#06b6d4"
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
            />
            <Bar
              dataKey="errorCount"
              name="Errors"
              stackId="b"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
            />
            <Line
              type="monotone"
              dataKey="errorRate"
              name="Error Rate (%)"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
