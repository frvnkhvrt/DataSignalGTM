import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
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
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-4 rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-10 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Failed to load data</p>
        <p className="max-w-sm text-xs leading-5 text-muted-foreground">
          {message ?? "Something went wrong while fetching this content. Our team has been notified."}
        </p>
      </div>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}

export { QueryError };
