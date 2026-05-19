"use server";

import {
  actionFailure,
  actionSuccess,
  type ActionResult,
} from "@/lib/actions/result";
import type {
  GapScoreResult,
  ResolveAllGapsResult,
} from "@/lib/queries/data-issues";
import { createServerSupabaseClient, getAuthContext } from "@/lib/supabase/server";

type AuthGate =
  | { ok: true; auth: NonNullable<Awaited<ReturnType<typeof getAuthContext>>> }
  | { ok: false; error: ActionResult<never> };

async function requireAuth(): Promise<AuthGate> {
  const auth = await getAuthContext();
  if (!auth) {
    return { ok: false, error: actionFailure("Unauthorized.", "unauthorized") };
  }
  if (auth.isDemo) {
    return {
      ok: false,
      error: actionFailure("Demo mode is read-only.", "forbidden"),
    };
  }
  return { ok: true, auth };
}

export async function resolveGapAction(
  issueId: string
): Promise<ActionResult<GapScoreResult | null>> {
  const gate = await requireAuth();
  if (!gate.ok) return gate.error;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("resolve_data_issue", {
    issue_id: issueId,
  });
  if (error) return actionFailure(error.message, "unknown");
  return actionSuccess(data?.[0] ?? null);
}

export async function dismissGapAction(
  issueId: string
): Promise<ActionResult<GapScoreResult | null>> {
  const gate = await requireAuth();
  if (!gate.ok) return gate.error;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("dismiss_data_issue", {
    issue_id: issueId,
  });
  if (error) return actionFailure(error.message, "unknown");
  return actionSuccess(data?.[0] ?? null);
}

export async function resolveAllGapsAction(
  accountId: string
): Promise<ActionResult<ResolveAllGapsResult | null>> {
  const gate = await requireAuth();
  if (!gate.ok) return gate.error;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("resolve_all_open_issues", {
    account_id: accountId,
  });
  if (error) return actionFailure(error.message, "unknown");
  return actionSuccess(data?.[0] ?? null);
}
