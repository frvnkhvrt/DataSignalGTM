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
      ? "text-emerald-400"
      : accent === "amber"
        ? "text-amber-400"
        : accent === "red"
          ? "text-red-400"
          : "text-zinc-100";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-zinc-500">
        {icon}
        {label}
      </div>
      <div className={`mt-2 font-mono text-xl font-semibold ${valueColor}`}>
        {value}
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const org = useCurrentOrg();
  const { data: accounts = [], isLoading } = useQuery(accountsByDqQuery(org.id));
  const { data: issueCounts = [] } = useQuery(dataIssueCountsQuery(org.id));
  const counts = bucketCounts(accounts);
  const totalGaps = issueCounts.reduce((sum, issue) => sum + issue.count, 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100 sm:text-2xl">
          Accounts
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Audit account data quality, ICP fit, and data gaps by workspace.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard
          label="Total"
          value={counts.total}
          icon={<ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />}
        />
        <StatCard
          label="Healthy"
          value={counts.healthy}
          accent="emerald"
          icon={<ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}
        />
        <StatCard
          label="Held"
          value={counts.held}
          accent="amber"
          icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
        />
        <StatCard
          label="Critical"
          value={counts.critical}
          accent="red"
          icon={<CircleAlert className="h-3.5 w-3.5 text-red-400" />}
        />
        <StatCard
          label="Open gaps"
          value={totalGaps}
          accent={totalGaps > 0 ? "amber" : "zinc"}
          icon={<Wrench className="h-3.5 w-3.5 text-zinc-400" />}
        />
      </div>

      <AccountsTable
        accounts={accounts}
        issueCounts={issueCounts}
        isLoading={isLoading}
      />
    </div>
  );
}
