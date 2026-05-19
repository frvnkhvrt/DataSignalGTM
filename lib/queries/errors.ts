import type { Playbook } from "@/lib/db-types";
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

export type SignalTransitionInput = {
  accountName: string;
  from: SignalStatus;
  to: SignalStatus;
  playbook: Playbook | null;
};

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
