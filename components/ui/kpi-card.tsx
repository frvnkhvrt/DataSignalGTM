"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { spring } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

type KpiTone = "default" | "success" | "warning" | "destructive" | "info";

const valueTone: Record<KpiTone, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  info: "text-info",
};

const iconTone: Record<KpiTone, string> = {
  default: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  info: "text-info",
};

const iconGlow: Record<KpiTone, string> = {
  default: "",
  success: "shadow-[0_0_12px_color-mix(in_oklch,var(--success)_22%,transparent)]",
  warning: "shadow-[0_0_12px_color-mix(in_oklch,var(--warning)_22%,transparent)]",
  destructive: "shadow-[0_0_12px_color-mix(in_oklch,var(--destructive)_22%,transparent)]",
  info: "shadow-[0_0_12px_color-mix(in_oklch,var(--info)_22%,transparent)]",
};

const accentTone: Record<KpiTone, string> = {
  default: "border-l-border",
  success: "border-l-success/60",
  warning: "border-l-warning/60",
  destructive: "border-l-destructive/60",
  info: "border-l-info/60",
};

/**
 * Unified KPI / metric tile used across Dashboard, Accounts, and Usage.
 *
 * - `size="sm"` – compact grid tile (text-xl, for 5-column stat grids)
 * - `size="default"` – prominent metric (text-3xl, for dashboard hero row)
 */
export function KpiCard({
  label,
  value,
  description,
  sub,
  icon,
  tone = "default",
  size = "sm",
  className,
}: {
  label: string;
  value: string | number;
  /** Longer supporting copy shown below the value (default size only). */
  description?: string;
  /** Short secondary line shown below the value (compact size). */
  sub?: string;
  icon: React.ReactNode;
  tone?: KpiTone;
  size?: "sm" | "default";
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <Card
      variant="translucent"
      className={cn(
        "flex min-h-0 flex-col gap-0 border-l-2 p-0 shadow-none transition-[background-color,box-shadow,border-color] duration-[var(--ds-duration-fast)] ease-[var(--ease-premium)] motion-reduce:transition-none hover:bg-surface-elevated/80 hover:shadow-soft",
        accentTone[tone],
        className
      )}
    >
      <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 p-4 pb-2">
        <div className="ds-eyebrow">{label}</div>
        <div
          className={cn(
            "rounded-lg border border-border bg-background/40 p-1.5 ds-inset-top-soft transition-[box-shadow] duration-[var(--ds-duration-fast)] ease-[var(--ease-premium)] motion-reduce:transition-none",
            iconTone[tone],
            iconGlow[tone]
          )}
        >
          {icon}
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col justify-between gap-1.5 px-4 pb-4 pt-0">
        <motion.div
          key={String(value)}
          className={cn(
            "font-mono tabular-nums font-semibold",
            valueTone[tone],
            size === "default" ? "text-3xl" : "text-xl"
          )}
          initial={reduced ? {} : { opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduced ? { duration: 0 } : spring.metricPop}
        >
          {value}
        </motion.div>

        {description && (
          <p className="text-pretty text-xs leading-5 text-muted-foreground">{description}</p>
        )}
        {sub && <div className="text-pretty text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
