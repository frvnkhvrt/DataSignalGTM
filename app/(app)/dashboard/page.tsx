"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { StatusPill } from "@/components/ui/status-pill";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { QueryError } from "@/components/ui/query-error";
import {
  PageReveal,
  Stagger,
  StaggerItem,
  MotionCard,
  MotionList,
  MotionListItem,
} from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentOrg } from "@/lib/auth-context";
import { accountsByDqQuery, signalsRecentQuery } from "@/lib/gtm-queries";
import type { SignalStatus } from "@/types/signal";

const kpiSkeletonDelays = [
  "ds-shimmer-delay-0",
  "ds-shimmer-delay-1",
  "ds-shimmer-delay-2",
  "ds-shimmer-delay-3",
] as const;

const DashboardCharts = dynamic(
  () =>
    import("@/components/dashboard/dashboard-charts").then(
      (mod) => mod.DashboardCharts
    ),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[22rem] rounded-xl border border-border/50 bg-card/40 ds-card-inner-glow" />
    ),
  }
);

export default function DashboardPage() {
  const org = useCurrentOrg();
  const {
    data: signals = [],
    isLoading: signalsLoading,
    isError: signalsError,
    refetch: refetchSignals,
  } = useQuery(signalsRecentQuery(org.id));
  const {
    data: accounts = [],
    isLoading: accountsLoading,
    isError: accountsError,
    refetch: refetchAccounts,
  } = useQuery(accountsByDqQuery(org.id));

  const isLoading = signalsLoading || accountsLoading;
  const isError = signalsError || accountsError;
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

  if (isError) {
    return (
      <div className="min-w-0 p-4 sm:p-6 lg:p-8">
        <QueryError
          message="Could not load dashboard data. Check your connection and try again."
          onRetry={() => {
            void refetchSignals();
            void refetchAccounts();
          }}
          className="mx-auto max-w-lg"
        />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 p-4 sm:space-y-7 sm:p-6 lg:p-8">
      {/* Hero — immediate entrance */}
      <PageReveal order={0}>
        <section className="ds-card-inner-glow overflow-hidden rounded-2xl border border-border/70 bg-card/65 p-5 shadow-soft backdrop-blur-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
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
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button asChild variant="default" size="default">
                <Link href="/signals">
                  Review signals
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="default">
                <Link href="/help/signals">Learn lifecycle</Link>
              </Button>
            </div>
          </div>
        </section>
      </PageReveal>

      {/* Metric cards — staggered */}
      <PageReveal order={1}>
        {isLoading ? (
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className={`h-36 rounded-xl border border-border/45 bg-card/35 ds-card-inner-glow ${kpiSkeletonDelays[index % 4]}`}
              />
            ))}
          </div>
        ) : (
          <Stagger className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            <StaggerItem>
              <MotionCard>
                <KpiCard
                  label="Pending signals"
                  value={pending}
                  tone="warning"
                  size="default"
                  description="Need review before reps act."
                  icon={<Radio className="h-4 w-4" />}
                />
              </MotionCard>
            </StaggerItem>
            <StaggerItem>
              <MotionCard>
                <KpiCard
                  label="Average DQ"
                  value={avgDq}
                  tone={avgDq >= 85 ? "success" : "warning"}
                  size="default"
                  description="Account data health across workspace."
                  icon={<ShieldCheck className="h-4 w-4" />}
                />
              </MotionCard>
            </StaggerItem>
            <StaggerItem>
              <MotionCard>
                <KpiCard
                  label="Approved"
                  value={approved}
                  tone="success"
                  size="default"
                  description="Ready for follow-up motion."
                  icon={<CheckCircle2 className="h-4 w-4" />}
                />
              </MotionCard>
            </StaggerItem>
            <StaggerItem>
              <MotionCard>
                <KpiCard
                  label="Playbooks"
                  value={playbookReady}
                  tone="info"
                  size="default"
                  description="Generated strategies attached to signals."
                  icon={<Sparkles className="h-4 w-4" />}
                />
              </MotionCard>
            </StaggerItem>
          </Stagger>
        )}
      </PageReveal>

      {/* Charts — slightly later */}
      <PageReveal order={2}>
        <DashboardCharts accounts={accounts} signals={signals} />
      </PageReveal>

      {/* Bottom panels — last to arrive */}
      <PageReveal order={3}>
        <section className="grid min-w-0 gap-4 lg:grid-cols-[1.22fr_0.78fr] lg:gap-5 xl:grid-cols-[1.22fr_0.78fr]">
          <Card variant="translucent" className="min-w-0 shadow-soft ds-card-inner-glow">
            <CardHeader className="flex flex-row items-start justify-between gap-3 sm:items-center">
              <div className="min-w-0">
                <CardTitle className="ds-heading">Recent signal queue</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Triage these before moving to account remediation.
                </p>
              </div>
              <Link
                href="/signals"
                className="ds-focus-ring shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium text-primary transition-colors duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] hover:text-primary/85"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="min-w-0">
              {topSignals.length === 0 ? (
                <EmptyState
                  density="compact"
                  icon={<Radio className="h-6 w-6" />}
                  title="No signals yet"
                  description="Connect a webhook source or reset demo data to populate the review queue."
                  action={
                    <Button asChild variant="outline" size="sm">
                      <Link href="/help/webhook">Webhook setup</Link>
                    </Button>
                  }
                />
              ) : (
                <MotionList className="divide-y divide-border">
                  <AnimatePresence initial={false}>
                    {topSignals.map((signal) => (
                      <MotionListItem
                        key={signal.id}
                        className="flex items-center justify-between gap-3 rounded-lg py-3 pl-1 pr-1 transition-[background-color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none hover:bg-surface-elevated/35"
                      >
                        <div className="min-w-0 flex-1">
                          <div
                            className="truncate text-sm font-medium text-foreground"
                            title={signal.account_name ?? "Unknown account"}
                          >
                            {signal.account_name ?? "Unknown account"}
                          </div>
                          <p
                            className="line-clamp-1 text-xs text-muted-foreground"
                            title={
                              signal.why_now ??
                              signal.source ??
                              "Signal context pending"
                            }
                          >
                            {signal.why_now ?? signal.source ?? "Signal context pending"}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <StatusPill status={(signal.status ?? "pending") as SignalStatus} />
                        </div>
                      </MotionListItem>
                    ))}
                  </AnimatePresence>
                </MotionList>
              )}
            </CardContent>
          </Card>

          <Card variant="translucent" className="min-w-0 shadow-soft ds-card-inner-glow">
            <CardHeader className="flex flex-row items-start justify-between gap-3 sm:items-center">
              <div className="min-w-0">
                <CardTitle className="ds-heading">Data quality focus</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Accounts below 75 DQ are most likely to block signal conversion.
                </p>
              </div>
              <Link
                href="/accounts"
                className="ds-focus-ring shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium text-primary transition-colors duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] hover:text-primary/85"
              >
                View accounts
              </Link>
            </CardHeader>
            <CardContent className="min-w-0">
              {atRiskAccounts.length === 0 ? (
                <EmptyState
                  density="compact"
                  icon={<Database className="h-6 w-6" />}
                  title="No at-risk accounts"
                  description="Your account data quality is in good shape for this workspace."
                />
              ) : (
                <MotionList className="space-y-3">
                  <AnimatePresence initial={false}>
                    {atRiskAccounts.map((account) => (
                      <MotionListItem key={account.id}>
                        <Link
                          href="/accounts"
                          className="ds-focus-ring ds-inset-top-soft flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-background/35 px-3 py-2 transition-[background-color,border-color,box-shadow] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] hover:border-border/80 hover:bg-surface-elevated"
                        >
                          <span className="truncate text-sm font-medium text-foreground" title={account.name}>
                            {account.name}
                          </span>
                          <span className="shrink-0 font-mono text-xs tabular-nums text-warning">
                            {account.data_quality_score ?? 0} DQ
                          </span>
                        </Link>
                      </MotionListItem>
                    ))}
                  </AnimatePresence>
                </MotionList>
              )}
            </CardContent>
          </Card>
        </section>
      </PageReveal>
    </div>
  );
}
