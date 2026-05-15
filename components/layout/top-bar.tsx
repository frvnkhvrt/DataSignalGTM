"use client";

import { Command, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { transitionTopBarSubtitle } from "@/components/ui/motion";

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
  const reducedMotion = useReducedMotion();

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
      className="sticky top-0 z-10 flex h-14 items-center justify-between bg-background/82 px-4 backdrop-blur-xl sm:px-6 ds-chrome-divider"
    >
      {/* Contextual breadcrumb — cross-fades on route change for a premium feel */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={subtitle}
          className="font-display text-sm font-medium tracking-[-0.02em] text-muted-foreground"
          initial={
            reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 3 }
          }
          animate={{ opacity: 1, y: 0 }}
          exit={
            reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -3 }
          }
          transition={
            reducedMotion ? { duration: 0.01 } : transitionTopBarSubtitle
          }
        >
          {subtitle}
        </motion.p>
      </AnimatePresence>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="hidden group cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background/40 px-2 py-1 text-[11px] text-muted-foreground transition-[border-color,background-color,box-shadow,color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none ds-inset-top-mid hover:border-primary/20 hover:bg-surface-elevated/60 hover:text-foreground hover:ds-card-inner-glow hover:shadow-soft lg:flex"
        >
          <Command className="h-3 w-3" />
          <kbd className="rounded-md border border-border/70 bg-muted/55 px-1.5 py-0.5 font-mono text-[10px] leading-none text-muted-foreground/90 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05)] transition-colors group-hover:bg-muted/80">{shortcut}</kbd>
        </button>
        <Link 
          href="/settings/billing"
          className="hidden rounded-md border border-border/50 bg-background/30 px-2.5 py-1.5 text-right transition-[border-color,background-color,box-shadow] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none ds-inset-top-soft hover:border-border/80 hover:bg-surface-elevated/50 hover:ds-card-inner-glow hover:shadow-soft sm:block"
        >
          <div className="text-xs font-medium text-foreground">{org.name}</div>
          <div className="text-[11px] text-muted-foreground">
            {user.email ?? "Authenticated user"} · {org.role}
          </div>
        </Link>
        <Button
          type="button"
          onClick={signOut}
          disabled={isPending}
          variant="outline"
          size="sm"
          aria-label="Sign out of DataSignalGTM"
        >
          {isPending ? <Spinner size="md" /> : <LogOut className="h-3.5 w-3.5" />}
          Sign out
        </Button>
      </div>
    </header>
  );
}
