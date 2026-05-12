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
export function useRealtimeSync(orgId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`gtm-realtime:${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "signals",
          filter: `org_id=eq.${orgId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["org", orgId, "signals"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "accounts",
          filter: `org_id=eq.${orgId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["org", orgId, "accounts"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "data_issues",
          filter: `org_id=eq.${orgId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["org", orgId, "data-issues"],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, queryClient]);
}
