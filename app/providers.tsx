"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { MotionConfig } from "motion/react";
import {
  supabaseConfigured,
  supabaseMissingVars,
} from "@/lib/supabase/client";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motionDefaultsTransition } from "@/components/ui/motion";

function MissingEnvBanner() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="max-w-lg border-destructive/35 bg-destructive/10 text-sm">
        <CardHeader>
          <CardTitle className="text-destructive">
          Supabase not configured
          </CardTitle>
        </CardHeader>
        <CardContent>
        <p className="mb-3 text-muted-foreground">
          The following environment variable(s) are missing:
        </p>
        <ul className="mb-4 list-inside list-disc font-mono text-destructive">
          {supabaseMissingVars.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
        <p className="text-muted-foreground">
          Add them in your Vercel project settings or in{" "}
          <code className="text-foreground">.env.local</code>, then redeploy.
        </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  if (!supabaseConfigured) {
    return <MissingEnvBanner />;
  }

  return (
    <MotionConfig
      reducedMotion="user"
      transition={motionDefaultsTransition}
    >
      <AnalyticsProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </AnalyticsProvider>
    </MotionConfig>
  );
}
