import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ModelMetric } from '../../lib/types';

interface ModelUsageChartProps {
  data: ModelMetric[];
}

export function ModelUsageChart({ data }: ModelUsageChartProps) {
  // Sort models by usage count descending
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-app-border bg-app-panel text-slate-400">
        No model usage data available
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-app-border bg-app-panel p-5 shadow-lg shadow-black/10">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-100">Model Usage</h3>
        <p className="text-xs text-slate-400">Total requests and average latency per active model</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 30, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              horizontal={false}
            />
            <XAxis
              type="number"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey="model"
              type="category"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={140}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#1e293b',
                borderRadius: '8px',
                color: '#f8fafc',
              }}
              formatter={(value: any, name: any, props: any) => {
                const latency = props.payload.avgLatencyMs;
                return (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{String(name)}</p>
                    <p className="font-semibold text-slate-100">{Number(value).toLocaleString()} requests</p>
                    <p className="text-xs text-slate-400">Avg Latency: {Math.round(latency)}ms</p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="count"
              name="Requests"
              fill="#8b5cf6"
              radius={[0, 4, 4, 0]}
              barSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
