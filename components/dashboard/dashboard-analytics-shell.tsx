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
        "@container/analytics space-y-5 rounded-2xl border border-border/45 bg-card/35 p-3 shadow-soft ring-1 ring-black/[0.03] backdrop-blur-md dark:bg-card/25 dark:ring-white/[0.05] sm:space-y-6 sm:p-5",
        "ds-card-inner-glow",
        className
      )}
    >
      {children}
    </div>
  );
}
