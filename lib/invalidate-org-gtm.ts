import type { QueryClient } from "@tanstack/react-query";
import { orgQueryKeys, type OrgGtmDomain } from "@/lib/query-keys";

/**
 * Invalidate org-scoped GTM caches. Omit domains to invalidate the entire org subtree.
 */
export function invalidateOrgGtm(
  queryClient: QueryClient,
  orgId: string,
  domains?: OrgGtmDomain | OrgGtmDomain[]
): void {
  const keys = orgQueryKeys(orgId);

  if (!domains) {
    void queryClient.invalidateQueries({ queryKey: keys.all });
    return;
  }

  const list = Array.isArray(domains) ? domains : [domains];

  for (const domain of list) {
    switch (domain) {
      case "signals":
        void queryClient.invalidateQueries({ queryKey: keys.signals.all });
        break;
      case "accounts":
        void queryClient.invalidateQueries({ queryKey: keys.accounts.all });
        break;
      case "data-issues":
        void queryClient.invalidateQueries({ queryKey: keys.dataIssues.all });
        break;
      case "subscription":
        void queryClient.invalidateQueries({ queryKey: keys.subscription });
        break;
      case "tier":
        void queryClient.invalidateQueries({ queryKey: keys.tier });
        break;
      case "ai-usage":
        void queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === "org" &&
            query.queryKey[1] === orgId &&
            query.queryKey[2] === "ai-usage",
        });
        break;
      default: {
        const _exhaustive: never = domain;
        return _exhaustive;
      }
    }
  }
}

/** Invalidate signals + accounts — the most common mutation side-effect pair. */
export function invalidateSignalsAndAccounts(
  queryClient: QueryClient,
  orgId: string
): void {
  invalidateOrgGtm(queryClient, orgId, ["signals", "accounts"]);
}
