"use client";

import { usePathname } from "next/navigation";

function titleForPath(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/signals")) return "Signals";
  if (pathname.startsWith("/accounts")) return "Accounts";
  return "DataSignalGTM";
}

export function TopBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 h-14 border-b border-zinc-800 bg-zinc-950/95 flex items-center px-4 sm:px-6">
      <h1 className="text-sm font-medium text-zinc-200">
        {titleForPath(pathname)}
      </h1>
    </header>
  );
}
