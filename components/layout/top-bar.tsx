"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { accountsByDqQuery } from "@/lib/gtm-queries";

function titleForPath(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/signals")) return "Signals";
  if (pathname.startsWith("/accounts")) return "Accounts";
  return "DataSignalGTM";
}

export function TopBar() {
  const pathname = usePathname();
  const { data: accounts } = useQuery(accountsByDqQuery);

  const health =
    accounts && accounts.length
      ? Math.round(
          accounts.reduce((s, a) => s + (a.data_quality_score ?? 0), 0) /
            accounts.length
        )
      : null;

  return (
    <header className="sticky top-0 z-10 h-14 border-b border-zinc-800 bg-zinc-950/95 flex items-center justify-between px-4 sm:px-6">
      <h1 className="text-sm font-medium text-zinc-200">
        {titleForPath(pathname)}
      </h1>
      {health !== null && (
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-zinc-400">
            GTM Health Score:{" "}
            <span className="font-semibold font-mono tabular-nums text-emerald-400">
              {health}
            </span>
          </span>
        </div>
      )}
    </header>
  );
}
