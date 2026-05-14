"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Groups KPI metrics and charts in a single elevated surface — layout rhythm
 * inspired by shadcn dashboard blocks without replacing data-bound components.
 */
export function DashboardAnalyticsShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "@container/analytics relative isolate space-y-4 overflow-x-clip rounded-2xl border border-border/50 bg-card/42 p-4 shadow-soft ring-1 ring-black/[0.04] backdrop-blur-xl dark:bg-card/30 dark:ring-white/[0.06] sm:space-y-5 sm:p-5 lg:p-6",
        "ds-card-inner-glow",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/14 before:to-transparent dark:before:via-white/9",
        "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-black/[0.06] after:to-transparent dark:after:via-white/[0.05]",
        className
      )}
    >
      {children}
    </div>
  );
}
