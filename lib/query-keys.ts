/**
 * Centralized TanStack Query keys for org-scoped GTM data.
 * Use orgQueryKeys(orgId) everywhere — never inline ["org", orgId, …] strings.
 */

export type OrgGtmDomain =
  | "signals"
  | "accounts"
  | "data-issues"
  | "subscription"
  | "tier"
  | "ai-usage";

export function orgQueryKeys(orgId: string) {
  return {
    all: ["org", orgId] as const,
    accounts: {
      all: ["org", orgId, "accounts"] as const,
      byDq: ["org", orgId, "accounts", "by-dq"] as const,
    },
    signals: {
      all: ["org", orgId, "signals"] as const,
      recent: ["org", orgId, "signals", "recent"] as const,
      playbook: (accountName: string) =>
        ["org", orgId, "signals", "playbook", accountName] as const,
    },
    dataIssues: {
      all: ["org", orgId, "data-issues"] as const,
      forAccount: (accountId: string) =>
        ["org", orgId, "data-issues", accountId] as const,
      counts: ["org", orgId, "data-issues", "counts"] as const,
    },
    subscription: ["org", orgId, "subscription"] as const,
    tier: ["org", orgId, "tier"] as const,
    aiUsage: (days: number) => ["org", orgId, "ai-usage", days] as const,
  };
}
