"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Inline query-error state — distinct from EmptyState (no data) vs this (load failed).
 * Kept intentionally compact so it sits naturally in a page's content area.
 */
function QueryError({
  message,
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-4 rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-10 text-center",
        "shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.05),inset_0_0_0_1px_color-mix(in_oklch,var(--destructive)_8%,transparent)]",
        className
      )}
      initial={reduced ? {} : { opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={
        reduced
          ? { duration: 0 }
          : { type: "spring", stiffness: 380, damping: 28, mass: 0.85 }
      }
    >
      <motion.div
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive"
        initial={reduced ? {} : { rotate: -8, scale: 0.7, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: "spring", stiffness: 420, damping: 22, delay: 0.1 }
        }
      >
        <AlertTriangle className="h-5 w-5" />
      </motion.div>

      <motion.div
        className="space-y-1"
        initial={reduced ? {} : { opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 0.24, ease: [0.16, 1, 0.3, 1], delay: 0.16 }
        }
      >
        <p className="text-sm font-medium text-foreground">Failed to load data</p>
        <p className="max-w-sm text-xs leading-5 text-muted-foreground">
          {message ?? "Something went wrong while fetching this content. Our team has been notified."}
        </p>
      </motion.div>

      {onRetry && (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      )}
    </motion.div>
  );
}

export { QueryError };
