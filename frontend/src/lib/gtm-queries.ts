import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AccountRow = {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  employee_count: number | null;
  data_quality_score: number;
  icp_fit_score: number;
};

export type PlaybookStep = {
  day: number;
  channel: string;
  action: string;
  message_hint: string;
};

export type Playbook = {
  role_target: string;
  rationale: string;
  channels: string[];
  steps: PlaybookStep[];
};

export type SignalRow = {
  id: string;
  account_name: string;
  source: string | null;
  status: string;
  velocity_score: number;
  why_now: string | null;
  assigned_to: string | null;
  playbook: Playbook | null;
  created_at: string;
};

export const accountsByDqQuery = queryOptions({
  queryKey: ["accounts", "by-dq"],
  queryFn: async (): Promise<AccountRow[]> => {
    const { data, error } = await supabase
      .from("accounts")
      .select("id,name,domain,industry,employee_count,data_quality_score,icp_fit_score")
      .order("data_quality_score", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const accountsByIcpQuery = queryOptions({
  queryKey: ["accounts", "by-icp"],
  queryFn: async (): Promise<AccountRow[]> => {
    const { data, error } = await supabase
      .from("accounts")
      .select("id,name,domain,industry,employee_count,data_quality_score,icp_fit_score")
      .order("icp_fit_score", { ascending: false })
      .limit(3);
    if (error) throw error;
    return data ?? [];
  },
});

export const signalsRecentQuery = queryOptions({
  queryKey: ["signals", "recent"],
  queryFn: async (): Promise<SignalRow[]> => {
    const { data, error } = await supabase
      .from("signals")
      .select("id,account_name,source,status,velocity_score,why_now,assigned_to,playbook,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as SignalRow[];
  },
});

export const playbookForAccountQuery = (accountName: string) =>
  queryOptions({
    queryKey: ["signals", "playbook", accountName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signals")
        .select("playbook,assigned_to,why_now,source,velocity_score,status")
        .eq("account_name", accountName)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as
        | {
            playbook: Playbook | null;
            assigned_to: string | null;
            why_now: string | null;
            source: string | null;
            velocity_score: number;
            status: string;
          }
        | null;
    },
  });

export async function approveSignal(accountName: string) {
  const { error: sErr } = await supabase
    .from("signals")
    .update({ status: "approved" })
    .eq("account_name", accountName);
  if (sErr) throw sErr;

  const { data: acct, error: aErr } = await supabase
    .from("accounts")
    .select("data_quality_score")
    .eq("name", accountName)
    .maybeSingle();
  if (aErr) throw aErr;
  if (acct) {
    const next = Math.min(100, acct.data_quality_score + 5);
    const { error: uErr } = await supabase
      .from("accounts")
      .update({ data_quality_score: next })
      .eq("name", accountName);
    if (uErr) throw uErr;
  }
}

export type Tone = "good" | "warn" | "bad";

export function dqTone(score: number): Tone {
  if (score >= 90) return "good";
  if (score >= 75) return "warn";
  return "bad";
}

export function dqStatusLabel(score: number): "HEALTHY" | "HELD" | "CRITICAL" {
  if (score >= 90) return "HEALTHY";
  if (score >= 75) return "HELD";
  return "CRITICAL";
}
