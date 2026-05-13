"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { markRecentlyUpdated } from "@/lib/realtime-glow";

/**
 * Subscribes to Supabase realtime postgres_changes on the signals, accounts,
 * and data_issues tables.  On any event:
 *   1. The matching React Query caches are narrowly invalidated so the UI
 *      refetches fresh data.
 *   2. The updated record's ID is marked in the realtime-glow store so table
 *      rows can briefly highlight themselves on the next render.
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
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["org", orgId, "signals"] });
          // Mark the updated/inserted record for the row glow
          const id = (payload.new as { id?: string } | null)?.id
            ?? (payload.old as { id?: string } | null)?.id;
          if (id) markRecentlyUpdated("signals", id);
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
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["org", orgId, "accounts"] });
          const id = (payload.new as { id?: string } | null)?.id
            ?? (payload.old as { id?: string } | null)?.id;
          if (id) markRecentlyUpdated("accounts", id);
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
        (payload) => {
          queryClient.invalidateQueries({
            queryKey: ["org", orgId, "data-issues"],
          });
          const id = (payload.new as { id?: string } | null)?.id
            ?? (payload.old as { id?: string } | null)?.id;
          if (id) markRecentlyUpdated("data_issues", id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, queryClient]);
}
