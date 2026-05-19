import { queryOptions } from "@tanstack/react-query";
import { orgQueryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

export type AiUsageRow = Pick<
  Tables<"ai_usage">,
  "id" | "model" | "success" | "duration_ms" | "error_message" | "created_at"
>;

export const aiUsageQuery = (orgId: string, days: number) => {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  return queryOptions({
    queryKey: orgQueryKeys(orgId).aiUsage(days),
    queryFn: async (): Promise<AiUsageRow[]> => {
      const { data, error } = await supabase
        .from("ai_usage")
        .select("id,model,success,duration_ms,error_message,created_at")
        .eq("org_id", orgId)
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};
