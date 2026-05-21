export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return <div className="text-sm text-slate-300">{label}</div>;
}

export function ErrorState({ label = 'Something went wrong.' }: { label?: string }) {
  return <div className="rounded-md border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-300">{label}</div>;
}
