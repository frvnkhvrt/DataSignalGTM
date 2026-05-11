import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { SignalStatus } from "@/types/signal";
import { canTransition, isTerminal } from "@/types/signal";

export class TransitionError extends Error {
  constructor(
    public readonly from: SignalStatus,
    public readonly to: SignalStatus,
    public readonly accountName: string
  ) {
    super(
      isTerminal(from)
        ? `Signal for ${accountName} is already ${from}.`
        : `Cannot transition ${accountName} from ${from} to ${to}.`
    );
    this.name = "TransitionError";
  }
}

export function isTransitionError(err: unknown): err is TransitionError {
  return err instanceof TransitionError;
}

export type AccountRow = {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  employee_count: number | null;
  data_quality_score: number | null;
  icp_fit_score: number | null;
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
  account_name: string | null;
  source: string | null;
  status: string | null;
  velocity_score: number | null;
  why_now: string | null;
  assigned_to: string | null;
  playbook: Playbook | null;
  created_at: string | null;
};

export const accountsByDqQuery = queryOptions({
  queryKey: ["accounts", "by-dq"],
  queryFn: async (): Promise<AccountRow[]> => {
    const { data, error } = await supabase
      .from("accounts")
      .select(
        "id,name,domain,industry,employee_count,data_quality_score,icp_fit_score"
      )
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
      .select(
        "id,name,domain,industry,employee_count,data_quality_score,icp_fit_score"
      )
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
      .select(
        "id,account_name,source,status,velocity_score,why_now,assigned_to,playbook,created_at"
      )
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
        .select(
          "playbook,assigned_to,why_now,source,velocity_score,status"
        )
        .eq("account_name", accountName)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as {
        playbook: Playbook | null;
        assigned_to: string | null;
        why_now: string | null;
        source: string | null;
        velocity_score: number | null;
        status: string | null;
      } | null;
    },
  });

export async function transitionSignal(
  accountName: string,
  to: SignalStatus
) {
  const { data: current, error: fetchErr } = await supabase
    .from("signals")
    .select("status")
    .eq("account_name", accountName)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!current) throw new Error(`Signal not found for ${accountName}`);

  const from = (current.status ?? "pending") as SignalStatus;
  if (!canTransition(from, to)) {
    throw new TransitionError(from, to, accountName);
  }

  const { error } = await supabase
    .from("signals")
    .update({ status: to })
    .eq("account_name", accountName);
  if (error) throw error;
}

export async function approveSignal(accountName: string) {
  return transitionSignal(accountName, "approved");
}

export async function rejectSignal(accountName: string) {
  return transitionSignal(accountName, "rejected");
}

export type Tone = "good" | "warn" | "bad";

export function dqTone(score: number | null | undefined): Tone {
  const s = score ?? 0;
  if (s >= 90) return "good";
  if (s >= 75) return "warn";
  return "bad";
}

export function dqStatusLabel(
  score: number | null | undefined
): "HEALTHY" | "HELD" | "CRITICAL" {
  const s = score ?? 0;
  if (s >= 90) return "HEALTHY";
  if (s >= 75) return "HELD";
  return "CRITICAL";
}
