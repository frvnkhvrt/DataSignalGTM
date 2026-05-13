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
import { Card } from "@/components/ui/card";
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

function StatCard({
  label,
  value,
  icon,
  accent = "zinc",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: "zinc" | "emerald" | "amber" | "red";
}) {
  const valueColor =
    accent === "emerald"
      ? "text-success"
      : accent === "amber"
        ? "text-warning"
        : accent === "red"
          ? "text-destructive"
          : "text-foreground";

  return (
    <Card className="bg-card/80 p-4 transition-colors hover:bg-surface-elevated/80">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-2 font-mono text-xl font-semibold ${valueColor}`}>
        {value}
      </div>
    </Card>
  );
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
      <div>
        <h1 className="ds-heading text-2xl font-semibold text-foreground sm:text-3xl">
          Accounts
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Audit account data quality, ICP fit, and data gaps by workspace.
        </p>
      </div>

      <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StaggerItem>
          <StatCard
            label="Total"
            value={counts.total}
            icon={<ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Healthy"
            value={counts.healthy}
            accent="emerald"
            icon={<ShieldCheck className="h-3.5 w-3.5 text-success" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Held"
            value={counts.held}
            accent="amber"
            icon={<AlertTriangle className="h-3.5 w-3.5 text-warning" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Critical"
            value={counts.critical}
            accent="red"
            icon={<CircleAlert className="h-3.5 w-3.5 text-destructive" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Open gaps"
            value={totalGaps}
            accent={totalGaps > 0 ? "amber" : "zinc"}
            icon={<Wrench className="h-3.5 w-3.5 text-muted-foreground" />}
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
