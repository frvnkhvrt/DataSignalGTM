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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
      <Skeleton className="min-h-[20rem] w-full min-w-0 rounded-xl border border-border/50 bg-card/45 ds-card-inner-glow sm:min-h-[21rem]" />
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
      <div className="min-w-0 overflow-x-clip p-4 sm:p-6 lg:p-8">
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
    <div className="@container/dashboard min-w-0 space-y-4 overflow-x-clip p-4 sm:space-y-5 sm:p-6 lg:space-y-6 lg:p-8">
      {/* Hero + breadcrumb — block-style chrome */}
      <PageReveal order={0}>
        <div className="space-y-3 sm:space-y-4">
          <Breadcrumb className="text-muted-foreground">
            <BreadcrumbList className="text-xs sm:text-sm">
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="text-muted-foreground transition-colors duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] hover:text-foreground motion-reduce:transition-none">
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="opacity-40" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground">Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <section className="ds-card-inner-glow overflow-hidden rounded-2xl border border-border/65 bg-card/72 p-5 shadow-soft ring-1 ring-black/[0.05] backdrop-blur-md dark:bg-card/60 dark:ring-white/[0.07] sm:p-6">
            <div className="flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-stretch lg:justify-between lg:gap-8 xl:gap-10">
              <div className="min-w-0 flex-1">
                <Badge variant="brand" className="mb-3">
                  <Sparkles className="h-3 w-3" />
                  Executive overview
                </Badge>
                <h1 className="ds-heading text-balance text-3xl font-semibold text-foreground sm:text-4xl">
                  Your GTM signal layer, at a glance
                </h1>
                <p className="mt-2 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground">
                  Start with signal volume, data health, and playbook readiness. Drill
                  into Signals for workflow and Accounts for data quality remediation.
                </p>
              </div>
              <div className="flex w-full min-w-0 shrink-0 flex-col justify-end border-t border-border/50 pt-5 lg:w-auto lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 xl:pl-10">
                <ButtonGroup className="w-full min-w-0 gap-0 overflow-hidden rounded-xl border border-border/60 bg-background/40 p-0.5 shadow-soft ring-1 ring-black/[0.05] backdrop-blur-md dark:bg-background/25 dark:ring-white/[0.07] lg:w-auto">
                  <Button
                    asChild
                    variant="default"
                    size="default"
                    className="rounded-none border-0 px-4 shadow-none sm:px-5"
                  >
                    <Link href="/signals" className="inline-flex min-w-0 max-w-full items-center justify-center gap-2">
                      <span className="min-w-0 truncate">Review signals</span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="default"
                    className="rounded-none border-0 bg-background/40 shadow-none hover:bg-surface-elevated/80 sm:px-5"
                  >
                    <Link href="/help/signals" className="min-w-0 truncate sm:overflow-visible sm:whitespace-normal">
                      Learn lifecycle
                    </Link>
                  </Button>
                </ButtonGroup>
              </div>
            </div>
          </section>
        </div>
      </PageReveal>

      {/* KPI + charts — grouped surface (shadcn dashboard block rhythm) */}
      <DashboardAnalyticsShell>
        <div className="mb-0.5 flex min-w-0 items-center gap-3">
          <p className="ds-eyebrow shrink-0 text-muted-foreground">Workspace pulse</p>
          <Separator className="h-px flex-1 bg-gradient-to-r from-border/50 via-border/25 to-transparent" />
        </div>
        <PageReveal order={1}>
          {isLoading ? (
            <div className="grid min-w-0 auto-rows-fr gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className={`h-full min-h-36 rounded-xl border border-border/45 bg-card/35 ds-card-inner-glow ${kpiSkeletonDelays[index % 4]}`}
                />
              ))}
            </div>
          ) : (
            <Stagger className="grid min-w-0 auto-rows-fr gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              <StaggerItem className="min-h-0">
                <MotionCard className="h-full min-h-0">
                  <KpiCard
                    label="Pending signals"
                    value={pending}
                    tone="warning"
                    size="default"
                    description="Need review before reps act."
                    icon={<Radio className="h-4 w-4" />}
                    className="h-full"
                  />
                </MotionCard>
              </StaggerItem>
              <StaggerItem className="min-h-0">
                <MotionCard className="h-full min-h-0">
                  <KpiCard
                    label="Average DQ"
                    value={avgDq}
                    tone={avgDq >= 85 ? "success" : "warning"}
                    size="default"
                    description="Account data health across workspace."
                    icon={<ShieldCheck className="h-4 w-4" />}
                    className="h-full"
                  />
                </MotionCard>
              </StaggerItem>
              <StaggerItem className="min-h-0">
                <MotionCard className="h-full min-h-0">
                  <KpiCard
                    label="Approved"
                    value={approved}
                    tone="success"
                    size="default"
                    description="Ready for follow-up motion."
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    className="h-full"
                  />
                </MotionCard>
              </StaggerItem>
              <StaggerItem className="min-h-0">
                <MotionCard className="h-full min-h-0">
                  <KpiCard
                    label="Playbooks"
                    value={playbookReady}
                    tone="info"
                    size="default"
                    description="Generated strategies attached to signals."
                    icon={<Sparkles className="h-4 w-4" />}
                    className="h-full"
                  />
                </MotionCard>
              </StaggerItem>
            </Stagger>
          )}
        </PageReveal>

        <Separator className="my-1 bg-gradient-to-r from-transparent via-border/40 to-transparent sm:my-1.5" />

        <PageReveal order={2}>
          <DashboardCharts accounts={accounts} signals={signals} />
        </PageReveal>
      </DashboardAnalyticsShell>

      {/* Bottom panels — last to arrive */}
      <PageReveal order={3}>
        <div className="mb-3 flex min-w-0 items-center gap-3 sm:mb-4">
          <p className="ds-eyebrow shrink-0 text-muted-foreground">Operational queues</p>
          <Separator className="h-px flex-1 bg-gradient-to-r from-border/50 via-border/25 to-transparent" />
        </div>
        <section className="grid min-w-0 gap-4 @md/dashboard:gap-5 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:items-stretch lg:gap-5 xl:gap-6">
          <Card variant="translucent" className="flex h-full min-h-0 min-w-0 flex-col shadow-soft ring-1 ring-black/[0.04] transition-[box-shadow,border-color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none dark:ring-white/[0.06] ds-card-inner-glow hover:border-border/55 hover:shadow-soft">
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3 sm:items-center sm:pb-4">
              <div className="min-w-0 space-y-1">
                <CardTitle className="ds-heading text-base sm:text-[1.0625rem]">Recent signal queue</CardTitle>
                <CardDescription className="text-pretty">
                  Triage these before moving to account remediation.
                </CardDescription>
              </div>
              <Link
                href="/signals"
                className="ds-focus-ring shrink-0 self-start rounded-md px-1.5 py-0.5 text-xs font-medium text-primary transition-colors duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] hover:text-primary/85"
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
                <div className="rounded-xl border border-border/40 bg-background/[0.07] p-1.5 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] dark:bg-background/[0.09] dark:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05)]">
                  <MotionList className="space-y-2 p-0.5">
                    <AnimatePresence initial={false}>
                      {topSignals.map((signal) => (
                        <MotionListItem
                          key={signal.id}
                          className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border/45 bg-background/30 px-2.5 py-2 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.03)] transition-[background-color,border-color,box-shadow] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none hover:border-border/70 hover:bg-surface-elevated/45 focus-within:border-border/65 focus-within:shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_22%,transparent)] dark:bg-background/25"
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="ds-focus-ring min-w-0 flex-1 cursor-default rounded-md py-0.5 text-left outline-none"
                                tabIndex={0}
                              >
                                <div className="truncate text-sm font-medium text-foreground">
                                  {signal.account_name ?? "Unknown account"}
                                </div>
                                <p className="line-clamp-2 text-xs leading-snug text-muted-foreground sm:line-clamp-1">
                                  {signal.why_now ?? signal.source ?? "Signal context pending"}
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              align="start"
                              sideOffset={6}
                              className="max-w-xs border border-border/45 bg-popover/95 px-3 py-2 text-popover-foreground shadow-elevated ring-1 ring-border/25 backdrop-blur-md"
                            >
                              <p className="font-medium text-foreground">
                                {signal.account_name ?? "Unknown account"}
                              </p>
                              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                {signal.why_now ?? signal.source ?? "Signal context pending"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
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

          <Card variant="translucent" className="flex h-full min-h-0 min-w-0 flex-col shadow-soft ring-1 ring-black/[0.04] transition-[box-shadow,border-color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none dark:ring-white/[0.06] ds-card-inner-glow hover:border-border/55 hover:shadow-soft">
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3 sm:items-center sm:pb-4">
              <div className="min-w-0 space-y-1">
                <CardTitle className="ds-heading text-base sm:text-[1.0625rem]">Data quality focus</CardTitle>
                <CardDescription className="text-pretty">
                  Accounts below 75 DQ are most likely to block signal conversion.
                </CardDescription>
              </div>
              <Link
                href="/accounts"
                className="ds-focus-ring shrink-0 self-start rounded-md px-1.5 py-0.5 text-xs font-medium text-primary transition-colors duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] hover:text-primary/85"
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
                <div className="rounded-xl border border-border/40 bg-background/[0.07] p-1.5 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] dark:bg-background/[0.09] dark:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05)]">
                  <MotionList className="space-y-2 p-0.5">
                    <AnimatePresence initial={false}>
                      {atRiskAccounts.map((account) => (
                        <MotionListItem key={account.id} className="min-w-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href="/accounts"
                                className="ds-focus-ring ds-inset-top-soft flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/35 px-3 py-2.5 transition-[background-color,border-color,box-shadow] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none hover:border-border/85 hover:bg-surface-elevated/90 focus-visible:shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_22%,transparent)] dark:bg-background/28"
                              >
                                <span className="truncate text-sm font-medium text-foreground">
                                  {account.name}
                                </span>
                                <span className="shrink-0 font-mono text-xs tabular-nums text-warning">
                                  {account.data_quality_score ?? 0} DQ
                                </span>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              align="start"
                              sideOffset={6}
                              className="max-w-xs border border-border/45 bg-popover/95 px-3 py-2 text-popover-foreground shadow-elevated ring-1 ring-border/25 backdrop-blur-md"
                            >
                              <span className="font-medium text-foreground">{account.name}</span>
                              <span className="mt-1 block font-mono text-xs tabular-nums text-warning">
                                Data quality {account.data_quality_score ?? 0}
                              </span>
                            </TooltipContent>
                          </Tooltip>
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
