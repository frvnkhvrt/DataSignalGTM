"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentOrg } from "@/lib/auth-context";
import { accountsByDqQuery, signalsRecentQuery } from "@/lib/gtm-queries";
import type { SignalStatus } from "@/types/signal";

const DashboardCharts = dynamic(
  () =>
    import("@/components/dashboard/dashboard-charts").then(
      (mod) => mod.DashboardCharts
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[22rem] rounded-xl" />,
  }
);

function MetricCard({
  label,
  value,
  description,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  tone?: "default" | "success" | "warning" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "info"
          ? "text-info"
          : "text-foreground";

  return (
    <Card className="bg-card/80 p-4 transition-colors hover:bg-surface-elevated/80">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </div>
        <div className={`rounded-lg border border-border bg-background/40 p-1.5 ${toneClass}`}>
          {icon}
        </div>
      </div>
      <div className={`mt-3 font-mono text-3xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </Card>
  );
}

export default function DashboardPage() {
  const org = useCurrentOrg();
  const {
    data: signals = [],
    isLoading: signalsLoading,
  } = useQuery(signalsRecentQuery(org.id));
  const {
    data: accounts = [],
    isLoading: accountsLoading,
  } = useQuery(accountsByDqQuery(org.id));

  const isLoading = signalsLoading || accountsLoading;
  const pending = signals.filter((signal) => signal.status === "pending").length;
  const approved = signals.filter((signal) => signal.status === "approved").length;
  const playbookReady = signals.filter((signal) => signal.playbook).length;
  const avgDq =
    accounts.length > 0
      ? Math.round(
          accounts.reduce((sum, account) => sum + (account.data_quality_score ?? 0), 0) /
            accounts.length
        )
      : 0;
  const topSignals = signals.slice(0, 5);
  const atRiskAccounts = accounts
    .filter((account) => (account.data_quality_score ?? 0) < 75)
    .slice(0, 4);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-2xl border border-border bg-card/60 p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="brand" className="mb-3">
              <Sparkles className="h-3 w-3" />
              Executive overview
            </Badge>
            <h1 className="ds-heading text-3xl font-semibold text-foreground sm:text-4xl">
              Your GTM signal layer, at a glance
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Start with signal volume, data health, and playbook readiness. Drill
              into Signals for workflow and Accounts for data quality remediation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/signals"
              className="ds-focus-ring ds-pressable inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-glow hover:bg-primary/90"
            >
              Review signals
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/help/signals"
              className="ds-focus-ring ds-pressable inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background/40 px-4 text-sm font-medium text-foreground hover:bg-surface-elevated"
            >
              Learn lifecycle
            </Link>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : (
        <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StaggerItem>
            <MetricCard
              label="Pending signals"
              value={pending}
              tone="warning"
              description="Need review before reps act."
              icon={<Radio className="h-4 w-4" />}
            />
          </StaggerItem>
          <StaggerItem>
            <MetricCard
              label="Average DQ"
              value={avgDq}
              tone={avgDq >= 85 ? "success" : "warning"}
              description="Account data health across workspace."
              icon={<ShieldCheck className="h-4 w-4" />}
            />
          </StaggerItem>
          <StaggerItem>
            <MetricCard
              label="Approved"
              value={approved}
              tone="success"
              description="Ready for follow-up motion."
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
          </StaggerItem>
          <StaggerItem>
            <MetricCard
              label="Playbooks"
              value={playbookReady}
              tone="info"
              description="Generated strategies attached to signals."
              icon={<Sparkles className="h-4 w-4" />}
            />
          </StaggerItem>
        </Stagger>
      )}

      <DashboardCharts accounts={accounts} signals={signals} />

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="ds-heading">Recent signal queue</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Triage these before moving to account remediation.
              </p>
            </div>
            <Link
              href="/signals"
              className="text-xs font-medium text-primary hover:text-primary/80"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {topSignals.length === 0 ? (
              <EmptyState
                icon={<Radio className="h-6 w-6" />}
                title="No signals yet"
                description="Connect a webhook source or reset demo data to populate the review queue."
              />
            ) : (
              <div className="divide-y divide-border">
                {topSignals.map((signal) => (
                  <div
                    key={signal.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">
                        {signal.account_name ?? "Unknown account"}
                      </div>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {signal.why_now ?? signal.source ?? "Signal context pending"}
                      </p>
                    </div>
                    <StatusPill status={(signal.status ?? "pending") as SignalStatus} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle className="ds-heading">Data quality focus</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Accounts below 75 DQ are most likely to block signal conversion.
            </p>
          </CardHeader>
          <CardContent>
            {atRiskAccounts.length === 0 ? (
              <EmptyState
                icon={<Database className="h-6 w-6" />}
                title="No at-risk accounts"
                description="Your account data quality is in good shape for this workspace."
              />
            ) : (
              <div className="space-y-3">
                {atRiskAccounts.map((account) => (
                  <Link
                    key={account.id}
                    href="/accounts"
                    className="ds-focus-ring flex items-center justify-between rounded-lg border border-border bg-background/35 px-3 py-2 hover:bg-surface-elevated"
                  >
                    <span className="truncate text-sm font-medium text-foreground">
                      {account.name}
                    </span>
                    <span className="font-mono text-xs text-warning">
                      {account.data_quality_score ?? 0} DQ
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
