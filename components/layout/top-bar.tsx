"use client";

import { Command, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function subtitleForPath(pathname: string): string {
  if (pathname === "/dashboard") return "Executive overview";
  if (pathname.startsWith("/signals")) return "Review lifecycle and playbook readiness";
  if (pathname.startsWith("/accounts")) return "Data quality and ICP fit";
  if (pathname.startsWith("/admin/usage")) return "Generation activity and cost signals";
  if (pathname.startsWith("/admin")) return "Internal demo management tools";
  if (pathname.startsWith("/settings/billing")) return "Plan, limits, and invoices";
  return "Workspace";
}

/** Returns the platform-appropriate command-palette shortcut label. */
function useShortcutLabel(): string {
  const [label] = useState(() => {
    // navigator is only available in the browser; during SSR this returns the default.
    if (typeof navigator === "undefined") return "Ctrl K";
    return navigator.platform.toLowerCase().includes("mac") ||
      navigator.userAgent.includes("Mac")
      ? "⌘ K"
      : "Ctrl K";
  });
  return label;
}

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { org, user } = useAuthContext();
  const shortcut = useShortcutLabel();

  function signOut() {
    startTransition(async () => {
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    });
  }

  const subtitle = subtitleForPath(pathname);

  return (
    <header
      className="sticky top-0 z-10 flex h-14 items-center justify-between bg-background/82 px-4 backdrop-blur-xl sm:px-6"
      style={{ boxShadow: "inset 0 -1px 0 var(--color-border), inset 0 1px 0 rgb(255 255 255 / 0.03)" }}
    >
      {/* Contextual breadcrumb — cross-fades on route change for a premium feel */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={subtitle}
          className="font-display text-sm font-medium tracking-[-0.02em] text-muted-foreground"
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          {subtitle}
        </motion.p>
      </AnimatePresence>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1.5 rounded-md border border-border bg-background/40 px-2 py-1 text-[11px] text-muted-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.05)] lg:flex">
          <Command className="h-3 w-3" />
          <kbd className="rounded bg-muted/80 px-1.5 py-0.5 font-mono leading-none shadow-[inset_0_-1px_0_rgb(0_0_0_/_0.1)]">{shortcut}</kbd>
        </div>
        <div className="hidden rounded-md border border-border/50 bg-background/30 px-2.5 py-1.5 text-right shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)] sm:block">
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
