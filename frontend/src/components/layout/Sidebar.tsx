import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Radio, Building2, Activity } from "lucide-react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/signals", label: "Signals", icon: Radio },
  { to: "/accounts", label: "Accounts", icon: Building2 },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="fixed inset-y-0 left-0 w-56 sm:w-60 border-r border-zinc-800 bg-zinc-950 flex flex-col z-20">
      <div className="h-14 flex items-center gap-2 px-4 sm:px-5 border-b border-zinc-800">
        <div className="h-7 w-7 rounded-md bg-zinc-800 flex items-center justify-center">
          <Activity className="h-4 w-4 text-zinc-300" />
        </div>
        <span className="text-sm font-semibold text-zinc-100">DataSignalGTM</span>
      </div>
      <nav className="flex-1 px-2 sm:px-3 py-4 space-y-0.5">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm border-l-2 ${
                active
                  ? "border-emerald-400 bg-zinc-800/80 text-zinc-100"
                  : "border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
