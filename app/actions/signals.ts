"use server";

import {
  actionFailure,
  actionSuccess,
  type ActionResult,
} from "@/lib/actions/result";
import { parsePlaybook, toSignalStatus } from "@/lib/db-types";
import {
  ApproveRequiresPlaybookError,
  assertSignalTransition,
  TransitionError,
} from "@/lib/queries/errors";
import { createServerSupabaseClient, getAuthContext } from "@/lib/supabase/server";
import type { SignalStatus } from "@/types/signal";

export type SignalTransitionPayload = {
  signalId: string;
  accountName: string;
};

async function transitionSignalOnServer(
  signalId: string,
  to: SignalStatus
): Promise<ActionResult<SignalTransitionPayload>> {
  const auth = await getAuthContext();
  if (!auth) {
    return actionFailure("Unauthorized.", "unauthorized");
  }

  if (auth.isDemo) {
    return actionFailure("Demo mode is read-only.", "forbidden");
  }

  const supabase = await createServerSupabaseClient();
  const orgId = auth.org.id;

  const { data: current, error: fetchErr } = await supabase
    .from("signals")
    .select("id,account_name,status,playbook")
    .eq("org_id", orgId)
    .eq("id", signalId)
    .maybeSingle();

  if (fetchErr) {
    return actionFailure(fetchErr.message, "unknown");
  }
  if (!current) {
    return actionFailure(`Signal ${signalId} not found.`, "not_found");
  }

  const from = toSignalStatus(current.status);
  const accountName = current.account_name ?? "(unnamed signal)";

  try {
    assertSignalTransition({
      accountName,
      from,
      to,
      playbook: parsePlaybook(current.playbook),
    });
  } catch (err) {
    if (err instanceof ApproveRequiresPlaybookError) {
      return actionFailure(err.message, "playbook_required");
    }
    if (err instanceof TransitionError) {
      return actionFailure(err.message, "transition");
    }
    throw err;
  }

  const { error } = await supabase
    .from("signals")
    .update({ status: to })
    .eq("org_id", orgId)
    .eq("id", signalId);

  if (error) {
    return actionFailure(error.message, "unknown");
  }

  return actionSuccess({ signalId, accountName });
}

export async function approveSignalAction(
  signalId: string
): Promise<ActionResult<SignalTransitionPayload>> {
  return transitionSignalOnServer(signalId, "approved");
}

export async function rejectSignalAction(
  signalId: string
): Promise<ActionResult<SignalTransitionPayload>> {
  return transitionSignalOnServer(signalId, "rejected");
}
