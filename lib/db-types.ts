import {
  playbookSchema,
  type GeneratedPlaybook,
} from "@/lib/ai/generate-playbook";
import type { Tables } from "@/lib/supabase/types";
import { toSignalStatus, type SignalStatus } from "@/types/signal";

export type DbSignal = Tables<"signals">;
export type DbAccount = Tables<"accounts">;
export type DbDataIssue = Tables<"data_issues">;

export const PLAYBOOK_STATUSES = [
  "idle",
  "queued",
  "generating",
  "completed",
  "failed",
] as const;

export type PlaybookStatus = (typeof PLAYBOOK_STATUSES)[number];

export function isPlaybookStatus(value: string): value is PlaybookStatus {
  return (PLAYBOOK_STATUSES as readonly string[]).includes(value);
}

export type Playbook = GeneratedPlaybook;
export type PlaybookStep = Playbook["steps"][number];

export function parsePlaybook(json: unknown): Playbook | null {
  const result = playbookSchema.safeParse(json);
  return result.success ? result.data : null;
}

export type AccountRow = Pick<
  DbAccount,
  | "id"
  | "org_id"
  | "name"
  | "domain"
  | "industry"
  | "employee_count"
  | "data_quality_score"
  | "icp_fit_score"
  | "created_at"
>;

export type SignalRow = Pick<
  DbSignal,
  | "id"
  | "org_id"
  | "account_name"
  | "source"
  | "status"
  | "velocity_score"
  | "why_now"
  | "assigned_to"
  | "playbook_error"
  | "created_at"
> & {
  playbook: Playbook | null;
  playbook_status: PlaybookStatus;
};

export const SIGNAL_LIST_SELECT =
  "id,org_id,account_name,source,status,velocity_score,why_now,assigned_to,playbook,playbook_status,playbook_error,created_at";

type SignalListRow = Pick<
  DbSignal,
  | "id"
  | "org_id"
  | "account_name"
  | "source"
  | "status"
  | "velocity_score"
  | "why_now"
  | "assigned_to"
  | "playbook"
  | "playbook_status"
  | "playbook_error"
  | "created_at"
>;

export function mapSignalRow(row: SignalListRow): SignalRow {
  const playbookStatus = row.playbook_status;
  return {
    id: row.id,
    org_id: row.org_id,
    account_name: row.account_name,
    source: row.source,
    status: row.status,
    velocity_score: row.velocity_score,
    why_now: row.why_now,
    assigned_to: row.assigned_to,
    playbook_error: row.playbook_error,
    created_at: row.created_at,
    playbook: parsePlaybook(row.playbook),
    playbook_status: isPlaybookStatus(playbookStatus) ? playbookStatus : "idle",
  };
}

export type DataIssueRow = Pick<
  DbDataIssue,
  | "id"
  | "org_id"
  | "account_id"
  | "field_name"
  | "issue_type"
  | "severity"
  | "suggested_fix"
  | "status"
  | "score_impact"
  | "resolved_at"
  | "created_at"
>;

export function mapDataIssueRow(row: DbDataIssue): DataIssueRow {
  return {
    id: row.id,
    org_id: row.org_id,
    account_id: row.account_id,
    field_name: row.field_name,
    issue_type: row.issue_type,
    severity: row.severity,
    suggested_fix: row.suggested_fix,
    status: row.status,
    score_impact: row.score_impact,
    resolved_at: row.resolved_at,
    created_at: row.created_at,
  };
}

export { toSignalStatus, type SignalStatus };
