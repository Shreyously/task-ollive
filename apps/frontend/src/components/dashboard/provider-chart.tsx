import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ProviderMetric } from '../../lib/types';

interface ProviderChartProps {
  data: ProviderMetric[];
}

const PROVIDER_COLORS: Record<string, string> = {
  GOOGLE: '#6366f1', // Indigo
  GROQ: '#06b6d4',   // Cyan
  google: '#6366f1',
  groq: '#06b6d4',
};

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

export function ProviderChart({ data }: ProviderChartProps) {
  const chartData = data.map((item) => ({
    name: item.provider.toUpperCase(),
    value: item.count,
    avgLatencyMs: item.avgLatencyMs,
  }));

  const getColor = (name: string, index: number) => {
    return PROVIDER_COLORS[name] || PROVIDER_COLORS[name.toLowerCase()] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-app-border bg-app-panel text-slate-400">
        No provider distribution data available
      </div>
    );
  }

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="rounded-xl border border-app-border bg-app-panel p-5 shadow-lg shadow-black/10 flex flex-col justify-between">
      <div>
        <h3 className="text-base font-semibold text-slate-100">Provider Distribution</h3>
        <p className="text-xs text-slate-400">Share of total inference requests per provider</p>
      </div>

      <div className="my-2 flex h-52 w-full items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#1e293b',
                borderRadius: '8px',
                color: '#f8fafc',
              }}
              formatter={(value: any, name: any, props: any) => {
                const percent = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0';
                const latency = props.payload.avgLatencyMs;
                return (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{String(name)}</p>
                    <p className="font-semibold text-slate-100">{Number(value).toLocaleString()} requests ({percent}%)</p>
                    <p className="text-xs text-slate-400">Avg Latency: {Math.round(latency)}ms</p>
                  </div>
                );
              }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.name, index)} stroke="#0f172a" strokeWidth={2} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
