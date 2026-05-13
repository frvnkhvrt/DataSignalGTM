"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CircleAlert, ShieldCheck, Wrench } from "lucide-react";
import { useCurrentOrg } from "@/lib/auth-context";
import {
  accountsByDqQuery,
  dataIssueCountsQuery,
  type AccountRow,
} from "@/lib/gtm-queries";
import { AccountsTable } from "@/components/tables/accounts-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { QueryError } from "@/components/ui/query-error";

function bucketCounts(accounts: AccountRow[]) {
  return {
    total: accounts.length,
    healthy: accounts.filter((account) => (account.data_quality_score ?? 0) >= 90)
      .length,
    held: accounts.filter((account) => {
      const score = account.data_quality_score ?? 0;
      return score >= 75 && score < 90;
    }).length,
    critical: accounts.filter((account) => (account.data_quality_score ?? 0) < 75)
      .length,
  };
}

export default function AccountsPage() {
  const org = useCurrentOrg();
  const {
    data: accounts = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery(accountsByDqQuery(org.id));
  const { data: issueCounts = [] } = useQuery(dataIssueCountsQuery(org.id));
  const counts = bucketCounts(accounts);
  const totalGaps = issueCounts.reduce((sum, issue) => sum + issue.count, 0);

  if (isError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <QueryError
          message="Could not load accounts. Check your connection and try again."
          onRetry={() => void refetch()}
          className="mx-auto max-w-lg"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Accounts"
        title="Data quality &amp; ICP fit"
        description="Audit account data quality, ICP fit, and data gaps by workspace."
      />

      <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StaggerItem>
          <KpiCard
            label="Total"
            value={counts.total}
            icon={<ShieldCheck className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Healthy"
            value={counts.healthy}
            tone="success"
            icon={<ShieldCheck className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Held"
            value={counts.held}
            tone="warning"
            icon={<AlertTriangle className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Critical"
            value={counts.critical}
            tone="destructive"
            icon={<CircleAlert className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Open gaps"
            value={totalGaps}
            tone={totalGaps > 0 ? "warning" : "default"}
            icon={<Wrench className="h-4 w-4" />}
          />
        </StaggerItem>
      </Stagger>

      <AccountsTable
        accounts={accounts}
        issueCounts={issueCounts}
        isLoading={isLoading}
        isRefetching={isFetching && !isLoading}
      />
    </div>
  );
}
