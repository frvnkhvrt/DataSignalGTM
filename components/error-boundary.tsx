"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional label shown in the fallback message, e.g. "Charts" */
  feature?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    import("@sentry/nextjs")
      .then(({ captureException }) => captureException(error))
      .catch(() => {});
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <BoundaryFallback feature={this.props.feature} onRetry={this.reset} />
      );
    }
    return this.props.children;
  }
}

function BoundaryFallback({
  feature,
  onRetry,
}: {
  feature?: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-lg p-6">
      <Alert
        variant="softDestructive"
        className="flex flex-col items-center gap-4 px-6 py-10 text-center shadow-soft"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex w-full flex-col items-center gap-1">
          <AlertTitle className="text-sm font-medium text-foreground">
            {feature
              ? `${feature} failed to load`
              : "Something broke while rendering this view"}
          </AlertTitle>
          <AlertDescription className="max-w-sm text-xs leading-5 text-muted-foreground">
            Our team was notified. You can retry without losing the rest of your
            session.
          </AlertDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      </Alert>
    </div>
  );
}

/** Convenience wrapper with a "temporarily unavailable" AI-specific message. */
export function AIFeatureBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <Alert
          variant="softDestructive"
          className="text-sm shadow-soft"
        >
          <AlertTriangle className="h-4 w-4" aria-hidden />
          <AlertTitle>Playbook generation is temporarily unavailable</AlertTitle>
          <AlertDescription>
            Queued jobs will be retried automatically by Inngest.
          </AlertDescription>
        </Alert>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
