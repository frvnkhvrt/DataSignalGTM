"use client";

import { Command, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function titleForPath(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/signals")) return "Signals";
  if (pathname.startsWith("/accounts")) return "Accounts";
  if (pathname.startsWith("/admin/usage")) return "AI Usage";
  if (pathname.startsWith("/admin")) return "Admin";
  if (pathname.startsWith("/settings/billing")) return "Billing";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/help")) return "Help";
  return "DataSignalGTM";
}

function subtitleForPath(pathname: string): string {
  if (pathname === "/dashboard") return "Executive overview";
  if (pathname.startsWith("/signals")) return "Review lifecycle and playbook readiness";
  if (pathname.startsWith("/accounts")) return "Data quality and ICP fit";
  if (pathname.startsWith("/admin/usage")) return "Generation activity and cost signals";
  if (pathname.startsWith("/admin")) return "Internal demo management tools";
  if (pathname.startsWith("/settings/billing")) return "Plan, limits, and invoices";
  return "Workspace";
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
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/82 px-4 backdrop-blur-xl sm:px-6">
      <div>
        <h1 className="font-display text-sm font-medium tracking-[-0.02em] text-foreground">
          {titleForPath(pathname)}
        </h1>
        <p className="hidden text-[11px] text-muted-foreground md:block">
          {subtitleForPath(pathname)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1 rounded-md border border-border bg-background/40 px-2 py-1 text-[11px] text-muted-foreground lg:flex">
          <Command className="h-3 w-3" />
          <span>Press</span>
          <kbd className="rounded bg-muted px-1 font-mono">Ctrl K</kbd>
        </div>
        <div className="hidden text-right sm:block">
          <div className="text-xs font-medium text-foreground">{org.name}</div>
          <div className="text-[11px] text-muted-foreground">
            {user.email ?? "Authenticated user"} · {org.role}
          </div>
        </div>
        <Button
          type="button"
          onClick={signOut}
          disabled={isPending}
          variant="outline"
          size="sm"
          aria-label="Sign out of DataSignalGTM"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
