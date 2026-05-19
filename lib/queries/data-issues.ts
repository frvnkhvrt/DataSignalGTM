import { queryOptions } from "@tanstack/react-query";
import { mapDataIssueRow, type DataIssueRow } from "@/lib/db-types";
import { orgQueryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase/client";

const DATA_ISSUE_SELECT =
  "id,org_id,account_id,field_name,issue_type,severity,suggested_fix,status,score_impact,resolved_at,created_at";

export function dataIssuesForAccountQuery(orgId: string, accountId: string) {
  return queryOptions({
    queryKey: orgQueryKeys(orgId).dataIssues.forAccount(accountId),
    queryFn: async (): Promise<DataIssueRow[]> => {
      const { data, error } = await supabase
        .from("data_issues")
        .select(DATA_ISSUE_SELECT)
        .eq("org_id", orgId)
        .eq("account_id", accountId)
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapDataIssueRow);
    },
  });
}

export type DataIssueCount = { account_id: string; count: number };

export const dataIssueCountsQuery = (orgId: string) =>
  queryOptions({
    queryKey: orgQueryKeys(orgId).dataIssues.counts,
    queryFn: async (): Promise<DataIssueCount[]> => {
      const { data, error } = await supabase
        .from("data_issues")
        .select("account_id")
        .eq("org_id", orgId)
        .eq("status", "open");
      if (error) throw error;
      const map = new Map<string, number>();
      for (const row of data ?? []) {
        if (row.account_id) {
          map.set(row.account_id, (map.get(row.account_id) ?? 0) + 1);
        }
      }
      return Array.from(map, ([account_id, count]) => ({ account_id, count }));
    },
  });

export type GapScoreResult = {
  account_id: string;
  data_quality_score: number | null;
};

export type ResolveAllGapsResult = {
  data_quality_score: number | null;
  resolved_issue_count: number;
};
