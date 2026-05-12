import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export const LOW_DQ_AUTO_HOLD_THRESHOLD = 60;

export async function applySignalRulesForOrg({
  db,
  orgId,
}: {
  db: SupabaseClient<Database>;
  orgId: string;
}): Promise<{ held: number }> {
  const { data: lowQualityAccounts, error: accountError } = await db
    .from("accounts")
    .select("name")
    .eq("org_id", orgId)
    .lt("data_quality_score", LOW_DQ_AUTO_HOLD_THRESHOLD);

  if (accountError) throw accountError;

  const accountNames = (lowQualityAccounts ?? []).map((account) => account.name);
  if (accountNames.length === 0) return { held: 0 };

  const { data: updated, error: updateError } = await db
    .from("signals")
    .update({ status: "held" })
    .eq("org_id", orgId)
    .eq("status", "pending")
    .in("account_name", accountNames)
    .select("id");

  if (updateError) throw updateError;

  return { held: updated?.length ?? 0 };
}
