import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { SignalStatus } from "@/types/signal";
import { canTransition, isTerminal } from "@/types/signal";

/* ------------------------------------------------------------------ */
/*  Errors                                                             */
/* ------------------------------------------------------------------ */

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

export class ApproveRequiresPlaybookError extends Error {
  constructor(public readonly accountName: string) {
    super("Generate a playbook first before approving.");
    this.name = "ApproveRequiresPlaybookError";
  }
}

export function isApproveRequiresPlaybookError(
  err: unknown
): err is ApproveRequiresPlaybookError {
  return err instanceof ApproveRequiresPlaybookError;
}

/* ------------------------------------------------------------------ */
/*  Row types                                                          */
/* ------------------------------------------------------------------ */

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

export type DataIssueRow = {
  id: string;
  account_id: string | null;
  field_name: string | null;
  issue_type: string | null;
  severity: string | null;
  suggested_fix: string | null;
  status: string;
  score_impact: number;
  resolved_at: string | null;
  created_at: string | null;
};

export type GapScoreResult = {
  account_id: string;
  data_quality_score: number | null;
};

export type CreateDataIssueResult = {
  issue_id: string;
  data_quality_score: number | null;
};

export type ResolveAllGapsResult = {
  data_quality_score: number | null;
  resolved_issue_count: number;
};

/* ------------------------------------------------------------------ */
/*  Account queries                                                    */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Signal queries                                                     */
/* ------------------------------------------------------------------ */

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
          "id,playbook,assigned_to,why_now,source,velocity_score,status"
        )
        .eq("account_name", accountName)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as {
        id: string;
        playbook: Playbook | null;
        assigned_to: string | null;
        why_now: string | null;
        source: string | null;
        velocity_score: number | null;
        status: string | null;
      } | null;
    },
  });

/* ------------------------------------------------------------------ */
/*  Data-issues queries                                                */
/* ------------------------------------------------------------------ */

export function dataIssuesForAccountQuery(accountId: string) {
  return queryOptions({
    queryKey: ["data-issues", accountId],
    queryFn: async (): Promise<DataIssueRow[]> => {
      const { data, error } = await supabase
        .from("data_issues")
        .select(
          "id,account_id,field_name,issue_type,severity,suggested_fix,status,score_impact,resolved_at,created_at"
        )
        .eq("account_id", accountId)
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DataIssueRow[];
    },
  });
}

export type DataIssueCount = { account_id: string; count: number };

export const dataIssueCountsQuery = queryOptions({
  queryKey: ["data-issues", "counts"],
  queryFn: async (): Promise<DataIssueCount[]> => {
    const { data, error } = await supabase
      .from("data_issues")
      .select("account_id")
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

/* ------------------------------------------------------------------ */
/*  Signal transitions                                                 */
/* ------------------------------------------------------------------ */

export async function transitionSignal(
  accountName: string,
  to: SignalStatus
) {
  const { data: current, error: fetchErr } = await supabase
    .from("signals")
    .select("status,playbook")
    .eq("account_name", accountName)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!current) throw new Error(`Signal not found for ${accountName}`);

  const from = (current.status ?? "pending") as SignalStatus;
  if (!canTransition(from, to)) {
    throw new TransitionError(from, to, accountName);
  }

  if (to === "approved" && !current.playbook) {
    throw new ApproveRequiresPlaybookError(accountName);
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

/* ------------------------------------------------------------------ */
/*  Gap resolution                                                     */
/* ------------------------------------------------------------------ */

export async function resolveGap(
  issueId: string
): Promise<GapScoreResult | null> {
  const { data, error } = await supabase.rpc("resolve_data_issue", {
    issue_id: issueId,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function dismissGap(
  issueId: string
): Promise<GapScoreResult | null> {
  const { data, error } = await supabase.rpc("dismiss_data_issue", {
    issue_id: issueId,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function resolveAllGaps(
  accountId: string
): Promise<ResolveAllGapsResult | null> {
  const { data, error } = await supabase.rpc("resolve_all_open_issues", {
    account_id: accountId,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function createDataIssue({
  accountId,
  fieldName,
  issueType,
  severity,
  suggestedFix,
}: {
  accountId: string;
  fieldName: string;
  issueType: "missing" | "stale" | "invalid";
  severity: "low" | "medium" | "high";
  suggestedFix: string;
}): Promise<CreateDataIssueResult | null> {
  const { data, error } = await supabase.rpc("create_data_issue", {
    account_id: accountId,
    field_name: fieldName,
    issue_type: issueType,
    severity,
    suggested_fix: suggestedFix,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}

/* ------------------------------------------------------------------ */
/*  Playbook generation (Gemini via /api/generate-playbook)            */
/* ------------------------------------------------------------------ */

const _generating = new Set<string>();

export function isGeneratingPlaybook(signalId: string): boolean {
  return _generating.has(signalId);
}

export async function generatePlaybookForSignal(
  signalId: string
): Promise<Playbook> {
  if (_generating.has(signalId)) {
    throw new Error("Generation already in progress for this signal.");
  }
  _generating.add(signalId);
  try {
    const { data: signal, error: sigErr } = await supabase
      .from("signals")
      .select("account_name,why_now,velocity_score")
      .eq("id", signalId)
      .single();
    if (sigErr) throw sigErr;

    const { data: account } = await supabase
      .from("accounts")
      .select("industry,employee_count,data_quality_score,icp_fit_score")
      .eq("name", signal.account_name!)
      .maybeSingle();

    const res = await fetch("/api/generate-playbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        account_name: signal.account_name,
        industry: account?.industry ?? null,
        employee_count: account?.employee_count ?? null,
        data_quality_score: account?.data_quality_score ?? null,
        icp_fit_score: account?.icp_fit_score ?? null,
        why_now: signal.why_now || "No signal context available",
        velocity_score: signal.velocity_score ?? null,
      }),
    });

    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Generation failed" }));
      throw new Error(err.error || "Playbook generation failed");
    }

    const playbook: Playbook = await res.json();

    const { error: updateErr } = await supabase
      .from("signals")
      .update({ playbook: playbook as never })
      .eq("id", signalId);
    if (updateErr) throw updateErr;

    return playbook;
  } finally {
    _generating.delete(signalId);
  }
}

/* ------------------------------------------------------------------ */
/*  DQ helpers                                                         */
/* ------------------------------------------------------------------ */

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
