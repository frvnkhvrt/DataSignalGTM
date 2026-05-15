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
  org_id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  employee_count: number | null;
  data_quality_score: number | null;
  icp_fit_score: number | null;
  created_at: string | null;
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
  org_id: string;
  account_name: string | null;
  source: string | null;
  status: string | null;
  velocity_score: number | null;
  why_now: string | null;
  assigned_to: string | null;
  playbook: Playbook | null;
  playbook_error: string | null;
  playbook_status: "idle" | "queued" | "generating" | "completed" | "failed";
  created_at: string | null;
};

export type QueuePlaybookResult = {
  queued: true;
  signal_id: string;
};

export type DataIssueRow = {
  id: string;
  org_id: string;
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

export type SignalTransitionInput = {
  accountName: string;
  from: SignalStatus;
  to: SignalStatus;
  playbook: Playbook | null;
};

/* ------------------------------------------------------------------ */
/*  Account queries                                                    */
/* ------------------------------------------------------------------ */

export const accountsByDqQuery = (orgId: string) => queryOptions({
  queryKey: ["org", orgId, "accounts", "by-dq"],
  queryFn: async (): Promise<AccountRow[]> => {
    const { data, error } = await supabase
      .from("accounts")
      .select(
        "id,org_id,name,domain,industry,employee_count,data_quality_score,icp_fit_score,created_at"
      )
      .eq("org_id", orgId)
      .order("data_quality_score", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const accountsByIcpQuery = (orgId: string) => queryOptions({
  queryKey: ["org", orgId, "accounts", "by-icp"],
  queryFn: async (): Promise<AccountRow[]> => {
    const { data, error } = await supabase
      .from("accounts")
      .select(
        "id,org_id,name,domain,industry,employee_count,data_quality_score,icp_fit_score,created_at"
      )
      .eq("org_id", orgId)
      .order("icp_fit_score", { ascending: false })
      .limit(3);
    if (error) throw error;
    return data ?? [];
  },
});

/* ------------------------------------------------------------------ */
/*  Signal queries                                                     */
/* ------------------------------------------------------------------ */

export const signalsRecentQuery = (orgId: string) => queryOptions({
  queryKey: ["org", orgId, "signals", "recent"],
  queryFn: async (): Promise<SignalRow[]> => {
    const { data, error } = await supabase
      .from("signals")
      .select(
        "id,org_id,account_name,source,status,velocity_score,why_now,assigned_to,playbook,playbook_status,playbook_error,created_at"
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as SignalRow[];
  },
});

export const playbookForAccountQuery = (orgId: string, accountName: string) =>
  queryOptions({
    queryKey: ["org", orgId, "signals", "playbook", accountName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signals")
        .select(
          "id,org_id,playbook,playbook_status,playbook_error,assigned_to,why_now,source,velocity_score,status"
        )
        .eq("org_id", orgId)
        .eq("account_name", accountName)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as {
        id: string;
        org_id: string;
        playbook: Playbook | null;
        playbook_error: string | null;
        playbook_status: SignalRow["playbook_status"];
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

export function dataIssuesForAccountQuery(orgId: string, accountId: string) {
  return queryOptions({
    queryKey: ["org", orgId, "data-issues", accountId],
    queryFn: async (): Promise<DataIssueRow[]> => {
      const { data, error } = await supabase
        .from("data_issues")
        .select(
          "id,org_id,account_id,field_name,issue_type,severity,suggested_fix,status,score_impact,resolved_at,created_at"
        )
        .eq("org_id", orgId)
        .eq("account_id", accountId)
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DataIssueRow[];
    },
  });
}

export type DataIssueCount = { account_id: string; count: number };

export const dataIssueCountsQuery = (orgId: string) => queryOptions({
  queryKey: ["org", orgId, "data-issues", "counts"],
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

/* ------------------------------------------------------------------ */
/*  Signal transitions                                                 */
/* ------------------------------------------------------------------ */

export function assertSignalTransition({
  accountName,
  from,
  to,
  playbook,
}: SignalTransitionInput): void {
  if (!canTransition(from, to)) {
    throw new TransitionError(from, to, accountName);
  }

  if (to === "approved" && !playbook) {
    throw new ApproveRequiresPlaybookError(accountName);
  }
}

export type SignalTransitionResult = {
  signalId: string;
  accountName: string;
};

/**
 * Transition a signal by row id. Account name is resolved from the row so
 * callers can never accidentally target the wrong signal when multiple rows
 * share an account_name (e.g. webhook duplicates).
 */
export async function transitionSignal(
  orgId: string,
  signalId: string,
  to: SignalStatus
): Promise<SignalTransitionResult> {
  const { data: current, error: fetchErr } = await supabase
    .from("signals")
    .select("id,account_name,status,playbook")
    .eq("org_id", orgId)
    .eq("id", signalId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!current) throw new Error(`Signal ${signalId} not found`);

  const from = (current.status ?? "pending") as SignalStatus;
  const accountName = current.account_name ?? "(unnamed signal)";
  assertSignalTransition({
    accountName,
    from,
    to,
    playbook: current.playbook as Playbook | null,
  });

  const { error } = await supabase
    .from("signals")
    .update({ status: to })
    .eq("org_id", orgId)
    .eq("id", signalId);
  if (error) throw error;
  return { signalId, accountName };
}

export async function approveSignal(orgId: string, signalId: string) {
  return transitionSignal(orgId, signalId, "approved");
}

export async function rejectSignal(orgId: string, signalId: string) {
  return transitionSignal(orgId, signalId, "rejected");
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
  orgId: string,
  signalId: string
): Promise<QueuePlaybookResult> {
  const key = `${orgId}:${signalId}`;
  if (_generating.has(key)) {
    throw new Error("Generation already in progress for this signal.");
  }
  _generating.add(key);
  try {
    const res = await fetch("/api/generate-playbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signal_id: signalId,
      }),
    });

    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Generation failed" }));
      throw new Error(err.error || "Playbook generation failed");
    }

    return (await res.json()) as QueuePlaybookResult;
  } finally {
    _generating.delete(key);
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
