import { queryOptions } from "@tanstack/react-query";
import { orgQueryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase/client";
import type { PlanTier } from "@/lib/stripe";
import type { Tables } from "@/lib/supabase/types";

export type SubscriptionRow = Tables<"subscriptions">;

export const subscriptionQuery = (orgId: string) =>
  queryOptions({
    queryKey: orgQueryKeys(orgId).subscription,
    queryFn: async (): Promise<SubscriptionRow | null> => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("org_id", orgId)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

export const orgTierQuery = (orgId: string) =>
  queryOptions({
    queryKey: orgQueryKeys(orgId).tier,
    queryFn: async (): Promise<PlanTier> => {
      const { data, error } = await supabase
        .from("organizations")
        .select("subscription_tier")
        .eq("id", orgId)
        .single();
      if (error) throw error;
      return (data?.subscription_tier ?? "free") as PlanTier;
    },
  });
