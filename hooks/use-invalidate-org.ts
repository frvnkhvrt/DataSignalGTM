"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  invalidateOrgGtm,
  invalidateSignalsAndAccounts,
} from "@/lib/invalidate-org-gtm";
import type { OrgGtmDomain } from "@/lib/query-keys";

export function useInvalidateOrgGtm(orgId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = useCallback(
    (domains?: OrgGtmDomain | OrgGtmDomain[]) => {
      if (!orgId) return;
      invalidateOrgGtm(queryClient, orgId, domains);
    },
    [orgId, queryClient]
  );

  const invalidateSignalsAccounts = useCallback(() => {
    if (!orgId) return;
    invalidateSignalsAndAccounts(queryClient, orgId);
  }, [orgId, queryClient]);

  return {
    invalidateOrgGtm: invalidate,
    invalidateSignalsAndAccounts: invalidateSignalsAccounts,
  };
}
