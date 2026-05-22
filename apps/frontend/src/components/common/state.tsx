import { Loader2, AlertCircle } from 'lucide-react';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      <p className="mt-3 text-sm font-medium text-slate-400">{label}</p>
    </div>
  );
}

export function ErrorState({ label = 'Something went wrong.' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 py-10 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h4 className="mt-3 text-sm font-semibold text-slate-200">Execution Error</h4>
      <p className="mt-1 text-xs text-rose-300 max-w-sm">{label}</p>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-800/60 ${className}`} />
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-app-border bg-app-panel p-5 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <div className="h-64 flex items-end justify-between gap-3 pt-6">
        <Skeleton className="h-1/3 w-full" />
        <Skeleton className="h-1/2 w-full" />
        <Skeleton className="h-2/3 w-full" />
        <Skeleton className="h-3/4 w-full" />
        <Skeleton className="h-1/2 w-full" />
        <Skeleton className="h-5/6 w-full" />
        <Skeleton className="h-2/3 w-full" />
      </div>
    </div>
  );
}
