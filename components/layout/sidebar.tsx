"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Radio, Building2, Activity, BarChart3, CreditCard } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/signals", label: "Signals", icon: Radio },
  { href: "/accounts", label: "Accounts", icon: Building2 },
  { href: "/admin/usage", label: "AI Usage", icon: BarChart3 },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-x-0 bottom-0 z-20 flex h-16 border-t border-zinc-800 bg-zinc-950 sm:inset-x-auto sm:inset-y-0 sm:left-0 sm:h-auto sm:w-60 sm:flex-col sm:border-r sm:border-t-0">
      <div className="hidden h-14 items-center gap-2 border-b border-zinc-800 px-5 sm:flex">
        <div className="h-7 w-7 rounded-md bg-zinc-800 flex items-center justify-center">
          <Activity className="h-4 w-4 text-zinc-300" />
        </div>
        <span className="text-sm font-semibold text-zinc-100">
          DataSignalGTM
        </span>
      </div>
      <nav className="grid flex-1 grid-cols-3 gap-1 px-2 py-2 sm:block sm:space-y-0.5 sm:px-3 sm:py-4">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 rounded-md border-l-0 border-t-2 px-2 py-2 text-[11px] sm:flex-row sm:justify-start sm:gap-3 sm:border-l-2 sm:border-t-0 sm:px-3 sm:text-sm ${
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
