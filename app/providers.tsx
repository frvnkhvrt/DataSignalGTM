"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useRealtimeSync } from "@/lib/use-realtime";
import {
  supabaseConfigured,
  supabaseMissingVars,
} from "@/lib/supabase/client";

function RealtimeSync() {
  useRealtimeSync();
  return null;
}

function MissingEnvBanner() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-lg rounded-lg border border-red-800 bg-red-950/60 p-6 text-sm">
        <h2 className="mb-2 text-lg font-semibold text-red-300">
          Supabase not configured
        </h2>
        <p className="mb-3 text-zinc-300">
          The following environment variable(s) are missing:
        </p>
        <ul className="mb-4 list-inside list-disc font-mono text-red-400">
          {supabaseMissingVars.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
        <p className="text-zinc-400">
          Add them in your Vercel project settings or in{" "}
          <code className="text-zinc-300">.env.local</code>, then redeploy.
        </p>
      </div>
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
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  if (!supabaseConfigured) {
    return <MissingEnvBanner />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeSync />
      {children}
    </QueryClientProvider>
  );
}
