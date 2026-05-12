"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Forward to Sentry when available.
    import("@sentry/nextjs")
      .then(({ captureException }) => captureException(error))
      .catch(() => {});
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <EmptyState
        icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
        title="Something went wrong"
        description={
          error.message || "An unexpected error occurred. Our team has been notified."
        }
        action={
          <div className="space-y-3">
            <Button type="button" onClick={reset} variant="outline">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            {error.digest && (
              <p className="font-mono text-xs text-muted-foreground">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        }
      />
    </div>
  );
}
