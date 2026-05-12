"use client";

import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase/client";

function titleForPath(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/signals")) return "Signals";
  if (pathname.startsWith("/accounts")) return "Accounts";
  if (pathname.startsWith("/admin/usage")) return "AI Usage";
  if (pathname.startsWith("/settings/billing")) return "Billing";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/help")) return "Help";
  return "DataSignalGTM";
}

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { org, user } = useAuthContext();

  function signOut() {
    startTransition(async () => {
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 sm:px-6">
      <h1 className="text-sm font-medium text-zinc-200">
        {titleForPath(pathname)}
      </h1>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <div className="text-xs font-medium text-zinc-200">{org.name}</div>
          <div className="text-[11px] text-zinc-500">
            {user.email ?? "Authenticated user"} · {org.role}
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-900 disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </header>
  );
}
