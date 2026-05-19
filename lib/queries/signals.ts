import { queryOptions } from "@tanstack/react-query";
import { mapSignalRow, SIGNAL_LIST_SELECT, type SignalRow } from "@/lib/db-types";
import { orgQueryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase/client";

export const signalsRecentQuery = (orgId: string) =>
  queryOptions({
    queryKey: orgQueryKeys(orgId).signals.recent,
    queryFn: async (): Promise<SignalRow[]> => {
      const { data, error } = await supabase
        .from("signals")
        .select(SIGNAL_LIST_SELECT)
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapSignalRow);
    },
  });

export const playbookForAccountQuery = (orgId: string, accountName: string) =>
  queryOptions({
    queryKey: orgQueryKeys(orgId).signals.playbook(accountName),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signals")
        .select(
          "id,org_id,account_name,playbook,playbook_status,playbook_error,assigned_to,why_now,source,velocity_score,status,created_at"
        )
        .eq("org_id", orgId)
        .eq("account_name", accountName)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const mapped = mapSignalRow(data);
      return {
        id: mapped.id,
        org_id: mapped.org_id,
        playbook: mapped.playbook,
        playbook_error: mapped.playbook_error,
        playbook_status: mapped.playbook_status,
        assigned_to: mapped.assigned_to,
        why_now: mapped.why_now,
        source: mapped.source,
        velocity_score: mapped.velocity_score,
        status: mapped.status,
      };
    },
  });
