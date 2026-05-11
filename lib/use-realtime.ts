"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

/**
 * Subscribes to Supabase realtime postgres_changes on the signals and
 * accounts tables. On any insert/update/delete, the matching React Query
 * caches are narrowly invalidated so the UI refetches fresh data.
 *
 * Mount once near the top of the component tree (inside QueryClientProvider).
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("gtm-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "signals" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["signals"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "accounts" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["accounts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
