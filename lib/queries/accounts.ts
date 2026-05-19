import { queryOptions } from "@tanstack/react-query";
import type { AccountRow } from "@/lib/db-types";
import { orgQueryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase/client";

const ACCOUNT_LIST_SELECT =
  "id,org_id,name,domain,industry,employee_count,data_quality_score,icp_fit_score,created_at";

export const accountsByDqQuery = (orgId: string) =>
  queryOptions({
    queryKey: orgQueryKeys(orgId).accounts.byDq,
    queryFn: async (): Promise<AccountRow[]> => {
      const { data, error } = await supabase
        .from("accounts")
        .select(ACCOUNT_LIST_SELECT)
        .eq("org_id", orgId)
        .order("data_quality_score", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
