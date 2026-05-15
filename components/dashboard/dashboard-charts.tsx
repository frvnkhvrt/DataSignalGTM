"use client";

import * as React from "react";
import Link from "next/link";
import { useMemo } from "react";
import { useReducedMotion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { AccountRow, SignalRow } from "@/lib/gtm-queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

function formatDate(value: string | null): string {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

const dqTrendChartConfig = {
  dq: {
    label: "Running average DQ",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

const velocityChartConfig = {
  count: {
    label: "Signals in bucket",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig;

const scatterChartConfig = {
  fit: {
    label: "Account (ICP × DQ)",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

type ScatterPoint = {
  name: string;
  dq: number;
  icp: number;
  employees: number;
};

function ScatterAccountTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}) {
  if (!active || !payload?.length) return null;
  const raw = payload[0]?.payload;
  if (!raw || typeof raw !== "object") return null;
  const data = raw as ScatterPoint;
  return (
    <div
      className={cn(
        "ds-floating-surface grid min-w-[12rem] max-w-[min(100vw-2rem,16rem)] gap-1.5 rounded-lg px-2.5 py-1.5 text-xs"
      )}
    >
      <div className="truncate font-medium text-foreground" title={data.name}>
        {data.name}
      </div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>DQ</span>
        <span className="font-mono font-medium text-foreground tabular-nums">{data.dq}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>ICP fit</span>
        <span className="font-mono font-medium text-foreground tabular-nums">{data.icp}</span>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-1.5 text-[11px] text-muted-foreground">
        <span>Headcount (bubble size)</span>
        <span className="font-mono text-foreground tabular-nums">{data.employees}</span>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  href,
  children,
}: {
  title: string;
  subtitle: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="min-w-0 border border-border/65 bg-card/70 shadow-soft ring-1 ring-border/25 backdrop-blur-md dark:ring-white/[0.06] ds-card-inner-glow">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="ds-heading text-base">{title}</CardTitle>
            <CardDescription className="text-xs leading-5">{subtitle}</CardDescription>
          </div>
          <Link
            href={href}
            className="ds-focus-ring shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium text-primary transition-colors duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] hover:text-primary/85"
          >
            View details
          </Link>
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="h-64 min-h-0 w-full">{children}</div>
      </CardContent>
    </Card>
  );
}

export function DashboardCharts({
  accounts,
  signals,
}: {
  accounts: AccountRow[];
  signals: SignalRow[];
}) {
  const reduced = useReducedMotion();
  const chartBegin = reduced ? 0 : 200;
  const lineDuration = reduced ? 0 : 800;
  const barDuration = reduced ? 0 : 650;
  const scatterDuration = reduced ? 0 : 700;

  const dqFillGradientId = React.useId().replace(/:/g, "");

  const dqTrend = useMemo(() => {
    const sorted = [...accounts].sort((a, b) =>
      (a.created_at ?? "").localeCompare(b.created_at ?? "")
    );

    return sorted.map((account, index) => {
      const runningTotal = sorted
        .slice(0, index + 1)
        .reduce((sum, item) => sum + (item.data_quality_score ?? 0), 0);
      return {
        label: formatDate(account.created_at),
        dq: Math.round(runningTotal / (index + 1)),
      };
    });
  }, [accounts]);

  const velocityDistribution = useMemo(() => {
    const buckets = [
      { range: "0-19", min: 0, max: 19, count: 0 },
      { range: "20-39", min: 20, max: 39, count: 0 },
      { range: "40-59", min: 40, max: 59, count: 0 },
      { range: "60-79", min: 60, max: 79, count: 0 },
      { range: "80-100", min: 80, max: 100, count: 0 },
    ];

    for (const signal of signals) {
      const score = signal.velocity_score ?? 0;
      const bucket = buckets.find((item) => score >= item.min && score <= item.max);
      if (bucket) bucket.count += 1;
    }

    return buckets.map(({ range, count }) => ({ range, count }));
  }, [signals]);

  const icpVsDq = useMemo(
    () =>
      accounts.map((account) => ({
        name: account.name,
        dq: account.data_quality_score ?? 0,
        icp: account.icp_fit_score ?? 0,
        employees: Math.max(10, account.employee_count ?? 10),
      })),
    [accounts]
  );

  return (
    <section className="min-w-0 space-y-4 pb-0 sm:space-y-5">
      <div className="flex min-w-0 flex-col gap-2 min-[400px]:flex-row min-[400px]:items-end min-[400px]:justify-between min-[400px]:gap-3">
        <div className="min-w-0">
          <p className="ds-eyebrow">Signal analytics</p>
          <h2 className="ds-heading mt-1 text-2xl font-semibold text-foreground">
            Health, velocity, and fit
          </h2>
        </div>
        <Badge variant="muted" className="min-w-0 max-w-full shrink truncate min-[400px]:max-w-[min(100%,18rem)]">
          Interactive hover insights
        </Badge>
      </div>
      <Stagger className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3">
        <StaggerItem>
          <ChartCard
            title="DQ Score Trend"
            subtitle="Running average by account creation order"
            href="/accounts"
          >
            <ChartContainer
              config={dqTrendChartConfig}
              className="aspect-auto h-full min-h-0 w-full [&_.recharts-area-area]:transition-[opacity] [&_.recharts-area-area]:duration-[var(--ds-duration-tactile)] [&_.recharts-area-area]:ease-[var(--ease-premium)]"
            >
              <AreaChart accessibilityLayer data={dqTrend} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id={dqFillGradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-dq)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-dq)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" className="stroke-border/50" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  minTickGap={28}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={36}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="min-w-36"
                      labelFormatter={(value) =>
                        typeof value === "string" ? value : "Trend point"
                      }
                      indicator="line"
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="dq"
                  name="dq"
                  stroke="var(--color-dq)"
                  strokeWidth={2.25}
                  fill={`url(#${dqFillGradientId})`}
                  dot={{ r: 2.5, fill: "var(--color-dq)", strokeWidth: 0 }}
                  activeDot={{
                    r: 5,
                    strokeWidth: 0,
                    fill: "var(--color-dq)",
                    className: "drop-shadow-[0_0_10px_color-mix(in_oklch,var(--color-dq)_55%,transparent)]",
                  }}
                  isAnimationActive={!reduced}
                  animationBegin={chartBegin}
                  animationDuration={lineDuration}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ChartContainer>
          </ChartCard>
        </StaggerItem>

        <StaggerItem>
          <ChartCard
            title="Velocity Distribution"
            subtitle="Signals grouped by velocity score"
            href="/signals"
          >
            <ChartContainer
              config={velocityChartConfig}
              className="aspect-auto h-full min-h-0 w-full"
            >
              <BarChart
                accessibilityLayer
                data={velocityDistribution}
                margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="4 4" className="stroke-border/50" vertical={false} />
                <XAxis
                  dataKey="range"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={36}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="min-w-32"
                      labelFormatter={(value) => `Velocity ${value}`}
                      indicator="dot"
                    />
                  }
                />
                <Bar
                  dataKey="count"
                  name="count"
                  fill="var(--color-count)"
                  radius={[7, 7, 3, 3]}
                  maxBarSize={48}
                  isAnimationActive={!reduced}
                  animationBegin={chartBegin}
                  animationDuration={barDuration}
                  animationEasing="ease-out"
                  className="motion-reduce:transition-none [&_rect]:transition-[filter] [&_rect]:duration-[var(--ds-duration-tactile)] [&_rect]:ease-[var(--ease-premium)] [&_rect]:hover:brightness-110"
                />
              </BarChart>
            </ChartContainer>
          </ChartCard>
        </StaggerItem>

        <StaggerItem>
          <ChartCard
            title="ICP Fit vs Data Quality"
            subtitle="Prioritize high-fit accounts with clean data"
            href="/accounts"
          >
            <ChartContainer config={scatterChartConfig} className="aspect-auto h-full min-h-0 w-full">
              <ScatterChart margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="4 4" className="stroke-border/50" />
                <XAxis
                  type="number"
                  dataKey="dq"
                  name="DQ"
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="icp"
                  name="ICP"
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={36}
                  tick={{ fontSize: 11 }}
                />
                <ZAxis type="number" dataKey="employees" range={[44, 220]} />
                <ChartTooltip
                  cursor={{
                    strokeDasharray: "4 4",
                    className: "stroke-border",
                  }}
                  content={<ScatterAccountTooltip />}
                />
                <Scatter
                  name="fit"
                  data={icpVsDq}
                  fill="var(--color-fit)"
                  fillOpacity={0.92}
                  isAnimationActive={!reduced}
                  animationBegin={chartBegin}
                  animationDuration={scatterDuration}
                  animationEasing="ease-out"
                  className="motion-reduce:transition-none [&_circle]:transition-[opacity,filter] [&_circle]:duration-[var(--ds-duration-tactile)] [&_circle]:ease-[var(--ease-premium)] [&_circle]:hover:opacity-100 [&_circle]:hover:drop-shadow-[0_0_12px_color-mix(in_oklch,var(--color-fit)_40%,transparent)]"
                />
              </ScatterChart>
            </ChartContainer>
          </ChartCard>
        </StaggerItem>
      </Stagger>
    </section>
  );
}
