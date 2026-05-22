import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  description?: string;
  icon?: ReactNode;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
}

export function MetricCard({
  label,
  value,
  description,
  icon,
  trend,
  trendType = 'neutral',
}: MetricCardProps) {
  const trendColor = {
    up: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    down: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    neutral: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  }[trendType];

  return (
    <div className="relative overflow-hidden rounded-xl border border-app-border bg-app-panel p-5 transition-all duration-300 hover:border-slate-700 hover:shadow-lg hover:shadow-black/20 group">
      {/* Background glow effect on hover */}
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-indigo-500/5 blur-2xl transition-all duration-500 group-hover:scale-150" />
      
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/50 shadow-inner group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-100 font-sans">
          {value}
        </span>
      </div>

      {(trend || description) && (
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-800/60 pt-3 text-xs">
          {description && (
            <span className="text-slate-400 line-clamp-1 font-light">
              {description}
            </span>
          )}
          {trend && (
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${trendColor}`}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
