/**
 * @deprecated Import from `@/lib/queries/*` directly. This barrel preserves
 * backward compatibility during the refactor.
 */
export type {
  AccountRow,
  DataIssueRow,
  Playbook,
  PlaybookStep,
  SignalRow,
} from "@/lib/db-types";

export type { QueuePlaybookResponse as QueuePlaybookResult } from "@/lib/api-contracts";

export {
  TransitionError,
  ApproveRequiresPlaybookError,
  isTransitionError,
  isApproveRequiresPlaybookError,
  assertSignalTransition,
  type SignalTransitionInput,
} from "@/lib/queries/errors";

export { accountsByDqQuery } from "@/lib/queries/accounts";

export {
  signalsRecentQuery,
  playbookForAccountQuery,
} from "@/lib/queries/signals";

export type { SignalTransitionPayload as SignalTransitionResult } from "@/app/actions/signals";

export {
  dataIssuesForAccountQuery,
  dataIssueCountsQuery,
  type DataIssueCount,
  type GapScoreResult,
  type ResolveAllGapsResult,
} from "@/lib/queries/data-issues";

export {
  generatePlaybookForSignal,
  isGeneratingPlaybook,
} from "@/lib/queries/playbooks";

export { dqTone, dqStatusLabel, type Tone } from "@/lib/queries/dq-helpers";

export {
  subscriptionQuery,
  orgTierQuery,
  type SubscriptionRow,
} from "@/lib/queries/billing";

export { aiUsageQuery, type AiUsageRow } from "@/lib/queries/admin";
