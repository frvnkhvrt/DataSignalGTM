"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Radio, Building2, Activity } from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/signals", label: "Signals", icon: Radio },
  { href: "/accounts", label: "Accounts", icon: Building2 },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-56 sm:w-60 border-r border-zinc-800 bg-zinc-950 flex flex-col z-20">
      <div className="h-14 flex items-center gap-2 px-4 sm:px-5 border-b border-zinc-800">
        <div className="h-7 w-7 rounded-md bg-emerald-500/15 flex items-center justify-center">
          <Activity className="h-4 w-4 text-emerald-400" />
        </div>
        <span className="text-sm font-semibold text-emerald-400">
          DataSignal<span className="text-zinc-100">GTM</span>
        </span>
      </div>
      <nav className="flex-1 px-2 sm:px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm border-l-2 ${
                active
                  ? "border-emerald-400 bg-emerald-500/10 text-emerald-400"
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
