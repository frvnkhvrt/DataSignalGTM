"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  approveSignalAction,
  rejectSignalAction,
} from "@/app/actions/signals";
import { useCurrentOrg } from "@/lib/auth-context";
import { unwrapActionResult, ActionError } from "@/lib/actions/result";
import {
  isApproveRequiresPlaybookError,
  isTransitionError,
} from "@/lib/queries/errors";
import { generatePlaybookForSignal } from "@/lib/queries/playbooks";
import { useInvalidateOrgGtm } from "@/hooks/use-invalidate-org";

export function handleSignalActionError(error: unknown): void {
  if (error instanceof ActionError) {
    if (error.code === "playbook_required") {
      toast.error(error.message);
      return;
    }
    if (error.code === "transition") {
      toast.info(error.message);
      return;
    }
    toast.error(error.message);
    return;
  }
  if (isApproveRequiresPlaybookError(error)) {
    toast.error(error.message);
    return;
  }
  if (isTransitionError(error)) {
    toast.info(error.message);
    return;
  }
  toast.error(error instanceof Error ? error.message : "Action failed");
}

export function useSignalMutations() {
  const org = useCurrentOrg();
  const { invalidateSignalsAndAccounts, invalidateOrgGtm } =
    useInvalidateOrgGtm(org.id);

  const approve = useMutation({
    mutationFn: async (signalId: string) =>
      unwrapActionResult(await approveSignalAction(signalId)),
    onSuccess: () => invalidateSignalsAndAccounts(),
  });

  const reject = useMutation({
    mutationFn: async (signalId: string) =>
      unwrapActionResult(await rejectSignalAction(signalId)),
    onSuccess: () => invalidateSignalsAndAccounts(),
  });

  const generate = useMutation({
    mutationFn: (signalId: string) =>
      generatePlaybookForSignal(org.id, signalId),
    onSuccess: () => invalidateOrgGtm("signals"),
  });

  return {
    approve,
    reject,
    generate,
    orgId: org.id,
    invalidateSignalsAndAccounts,
    handleSignalActionError,
  };
}
