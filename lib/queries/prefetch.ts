import { mapSignalRow, SIGNAL_LIST_SELECT, type AccountRow } from "@/lib/db-types";
import { orgQueryKeys } from "@/lib/query-keys";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ACCOUNT_LIST_SELECT =
  "id,org_id,name,domain,industry,employee_count,data_quality_score,icp_fit_score,created_at";

export async function prefetchDashboardQueries(orgId: string) {
  const supabase = await createServerSupabaseClient();

  const [signalsResult, accountsResult] = await Promise.all([
    supabase
      .from("signals")
      .select(SIGNAL_LIST_SELECT)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("accounts")
      .select(ACCOUNT_LIST_SELECT)
      .eq("org_id", orgId)
      .order("data_quality_score", { ascending: false }),
  ]);

  if (signalsResult.error) throw signalsResult.error;
  if (accountsResult.error) throw accountsResult.error;

  return {
    signals: (signalsResult.data ?? []).map(mapSignalRow),
    accounts: (accountsResult.data ?? []) as AccountRow[],
    keys: orgQueryKeys(orgId),
  };
}
