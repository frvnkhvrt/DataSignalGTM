"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { spring, transitionQueryErrorCopy } from "@/components/ui/motion";

/**
 * Inline query-error state — distinct from EmptyState (no data) vs this (load failed).
 * Built on shadcn Alert with Motion entrance; compact for page content areas.
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
      className={cn("w-full", className)}
      initial={reduced ? {} : { opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : spring.bouncy}
    >
      <Alert
        variant="softDestructive"
        className="flex w-full max-w-lg flex-col items-center gap-4 px-6 py-10 text-center shadow-soft"
      >
        <motion.div
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive"
          initial={reduced ? {} : { rotate: -8, scale: 0.7, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={reduced ? { duration: 0 } : { ...spring.bouncy, delay: 0.1 }}
        >
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </motion.div>
        <motion.div
          className="flex w-full flex-col items-center gap-1"
          initial={reduced ? {} : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : transitionQueryErrorCopy}
        >
          <AlertTitle className="text-sm font-medium text-foreground">Failed to load data</AlertTitle>
          <AlertDescription className="max-w-sm text-xs leading-5 text-muted-foreground">
            {message ??
              "Something went wrong while fetching this content. Our team has been notified."}
          </AlertDescription>
        </motion.div>
        {onRetry && (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        )}
      </Alert>
    </motion.div>
  );
}

export { QueryError };
