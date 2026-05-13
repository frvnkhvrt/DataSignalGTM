"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Card } from "@/components/ui/card";
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
      className={cn("p-4 transition-colors hover:bg-surface-elevated/80", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="ds-eyebrow">{label}</div>
        <div
          className={cn(
            "rounded-lg border border-border bg-background/40 p-1.5",
            iconTone[tone]
          )}
        >
          {icon}
        </div>
      </div>

      <motion.div
        key={String(value)}
        className={cn(
          "mt-3 font-mono tabular-nums font-semibold",
          valueTone[tone],
          size === "default" ? "text-3xl" : "text-xl"
        )}
        initial={reduced ? {} : { opacity: 0, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: "spring", stiffness: 480, damping: 32, mass: 0.75 }
        }
      >
        {value}
      </motion.div>

      {description && (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      )}
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}
