import { Link, Outlet, useLocation } from 'react-router-dom';

function NavLink({ to, label }: { to: string; label: string }) {
  const location = useLocation();
  const active = location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={`rounded-md px-3 py-2 text-sm font-medium ${
        active ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
      }`}
    >
      {label}
    </Link>
  );
}

export function AppShell() {
  return (
    <div className="min-h-screen bg-app-bg text-slate-100">
      <header className="border-b border-app-border bg-app-panel">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <h1 className="text-base font-semibold">LLM Observability</h1>
          <nav className="flex items-center gap-2">
            <NavLink to="/chat" label="Chat" />
            <NavLink to="/dashboard" label="Dashboard" />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
