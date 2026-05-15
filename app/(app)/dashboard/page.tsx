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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ButtonGroup } from "@/components/ui/button-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useCurrentOrg } from "@/lib/auth-context";
import { accountsByDqQuery, signalsRecentQuery } from "@/lib/gtm-queries";
import type { SignalStatus } from "@/types/signal";

import { DashboardAnalyticsShell } from "@/components/dashboard/dashboard-analytics-shell";

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
      <Skeleton className="h-[22rem] rounded-lg border border-border/50 bg-card/40 ds-card-inner-glow sm:rounded-xl" />
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
    <div className="@container/dashboard min-w-0 space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      {/* Hero + breadcrumb — block-style chrome */}
      <PageReveal order={0}>
        <div className="space-y-4">
          <Breadcrumb className="text-muted-foreground">
            <BreadcrumbList className="text-xs sm:text-sm">
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="text-muted-foreground hover:text-foreground">
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="opacity-40" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground">Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <section className="ds-card-inner-glow overflow-hidden rounded-2xl border border-border/70 bg-card/65 p-5 shadow-soft ring-1 ring-black/[0.04] backdrop-blur-sm dark:ring-white/[0.06] sm:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between lg:gap-10">
              <div className="min-w-0 flex-1">
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
              <div className="flex shrink-0 flex-col justify-end border-t border-border/45 pt-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                <ButtonGroup className="gap-0 overflow-hidden rounded-xl border border-border/55 bg-background/30 p-0.5 shadow-soft ring-1 ring-black/[0.04] backdrop-blur-sm dark:bg-background/20 dark:ring-white/[0.06]">
                  <Button
                    asChild
                    variant="default"
                    size="default"
                    className="rounded-none border-0 px-4 shadow-none sm:px-5"
                  >
                    <Link href="/signals">
                      Review signals
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="default"
                    className="rounded-none border-0 bg-background/40 shadow-none hover:bg-surface-elevated/80 sm:px-5"
                  >
                    <Link href="/help/signals">Learn lifecycle</Link>
                  </Button>
                </ButtonGroup>
              </div>
            </div>
          </section>
        </div>
      </PageReveal>

      {/* KPI + charts — grouped surface (shadcn dashboard block rhythm) */}
      <DashboardAnalyticsShell>
        <div className="flex min-w-0 items-center gap-3 pb-0.5">
          <p className="ds-eyebrow shrink-0 text-muted-foreground">Workspace pulse</p>
          <Separator className="h-px flex-1 bg-gradient-to-r from-border/50 via-border/25 to-transparent" />
        </div>
        <PageReveal order={1}>
          {isLoading ? (
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className={`h-36 rounded-xl border border-border/45 bg-card/35 ds-card-inner-glow ${kpiSkeletonDelays[index % 4]}`}
                />
              ))}
            </div>
          ) : (
            <Stagger className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              <StaggerItem>
                <MotionCard className="h-full">
                  <KpiCard
                    className="h-full"
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
                <MotionCard className="h-full">
                  <KpiCard
                    className="h-full"
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
                <MotionCard className="h-full">
                  <KpiCard
                    className="h-full"
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
                <MotionCard className="h-full">
                  <KpiCard
                    className="h-full"
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

        <Separator className="bg-gradient-to-r from-transparent via-border/45 to-transparent" />

        <PageReveal order={2}>
          <DashboardCharts accounts={accounts} signals={signals} />
        </PageReveal>
      </DashboardAnalyticsShell>

      {/* Bottom panels — last to arrive */}
      <PageReveal order={3}>
        <div className="mb-4 flex min-w-0 items-center gap-3 sm:mb-5">
          <p className="ds-eyebrow shrink-0 text-muted-foreground">Operational queues</p>
          <Separator className="h-px flex-1 bg-gradient-to-r from-border/50 via-border/25 to-transparent" />
        </div>
        <section className="grid min-w-0 gap-4 @md/dashboard:gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <Card variant="translucent" className="flex min-h-0 min-w-0 flex-col shadow-soft ring-1 ring-black/[0.03] dark:ring-white/[0.05] ds-card-inner-glow">
            <CardHeader className="flex flex-row items-start justify-between gap-3 sm:items-center">
              <div className="min-w-0 space-y-1">
                <CardTitle className="ds-heading">Recent signal queue</CardTitle>
                <CardDescription>
                  Triage these before moving to account remediation.
                </CardDescription>
              </div>
              <Link
                href="/signals"
                className="ds-focus-ring shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium text-primary transition-colors duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] hover:text-primary/85"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="min-h-0 min-w-0 flex-1 pt-0">
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
                <div className="rounded-xl border border-border/35 bg-background/[0.06] p-1 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.03)] dark:bg-background/[0.08] dark:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]">
                  <MotionList className="divide-y divide-border/60">
                    <AnimatePresence initial={false}>
                      {topSignals.map((signal) => (
                        <MotionListItem
                          key={signal.id}
                          className="ds-row flex items-center justify-between gap-3 rounded-lg py-2.5 pl-1 pr-1 transition-[background-color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none hover:bg-surface-elevated/35"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-foreground">
                              {signal.account_name ?? "Unknown account"}
                            </div>
                            <p className="line-clamp-1 text-xs text-muted-foreground">
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
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="translucent" className="flex min-h-0 min-w-0 flex-col shadow-soft ring-1 ring-black/[0.03] dark:ring-white/[0.05] ds-card-inner-glow">
            <CardHeader className="flex flex-row items-start justify-between gap-3 sm:items-center">
              <div className="min-w-0 space-y-1">
                <CardTitle className="ds-heading">Data quality focus</CardTitle>
                <CardDescription>
                  Accounts below 75 DQ are most likely to block signal conversion.
                </CardDescription>
              </div>
              <Link
                href="/accounts"
                className="ds-focus-ring shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium text-primary transition-colors duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] hover:text-primary/85"
              >
                View accounts
              </Link>
            </CardHeader>
            <CardContent className="min-h-0 min-w-0 flex-1 pt-0">
              {atRiskAccounts.length === 0 ? (
                <EmptyState
                  density="compact"
                  icon={<Database className="h-6 w-6" />}
                  title="No at-risk accounts"
                  description="Your account data quality is in good shape for this workspace."
                  action={
                    <Button asChild variant="outline" size="sm">
                      <Link href="/accounts">Browse accounts</Link>
                    </Button>
                  }
                />
              ) : (
                <div className="rounded-xl border border-border/35 bg-background/[0.06] p-1 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.03)] dark:bg-background/[0.08] dark:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]">
                  <MotionList className="space-y-2.5 p-0.5">
                    <AnimatePresence initial={false}>
                      {atRiskAccounts.map((account) => (
                        <MotionListItem key={account.id}>
                          <Link
                            href="/accounts"
                            className="ds-focus-ring ds-inset-top-soft ds-card-inner-glow flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-background/35 px-3 py-2 transition-[background-color,border-color,box-shadow] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] hover:border-border/80 hover:bg-surface-elevated"
                          >
                            <span className="truncate text-sm font-medium text-foreground">
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
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </PageReveal>
    </div>
  );
}
