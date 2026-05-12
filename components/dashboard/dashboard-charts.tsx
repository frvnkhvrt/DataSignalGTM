"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { AccountRow, SignalRow } from "@/lib/gtm-queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(value: string | null): string {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
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
    <Card className="bg-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="ds-heading text-base">{title}</CardTitle>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p>
          </div>
          <Link
            href={href}
            className="shrink-0 text-xs font-medium text-primary hover:text-primary/80"
          >
            View details
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">{children}</div>
      </CardContent>
    </Card>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  title,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string | number;
    value?: string | number;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string | number;
  title?: string;
}) {
  if (!active || !payload?.length) return null;

  const accountName = payload[0]?.payload?.name;

  return (
    <div className="rounded-lg border border-border bg-card/95 p-3 text-xs shadow-elevated backdrop-blur-xl">
      <div className="mb-2 font-medium text-foreground">
        {typeof accountName === "string" ? accountName : title ?? label}
      </div>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={`${item.name}-${item.value}`} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: item.color ?? "var(--color-primary)" }}
              />
              {String(item.name ?? "Value").toUpperCase()}
            </span>
            <span className="font-mono text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardCharts({
  accounts,
  signals,
}: {
  accounts: AccountRow[];
  signals: SignalRow[];
}) {
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
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="ds-eyebrow">Data design</p>
          <h2 className="ds-heading mt-1 text-2xl font-semibold text-foreground">
            Health, velocity, and fit
          </h2>
        </div>
        <Badge variant="muted">Interactive hover insights</Badge>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <ChartCard
        title="DQ Score Trend"
        subtitle="Running average by account creation order"
        href="/accounts"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dqTrend}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" />
            <XAxis dataKey="label" stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
            <Tooltip content={<ChartTooltip title="Data quality" />} />
            <Line
              type="monotone"
              dataKey="dq"
              name="DQ"
              stroke="var(--color-success)"
              strokeWidth={2}
              dot={{ r: 2, fill: "var(--color-success)" }}
              activeDot={{ r: 5, strokeWidth: 0, fill: "var(--color-success)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Velocity Distribution"
        subtitle="Signals grouped by velocity score"
        href="/signals"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={velocityDistribution}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" />
            <XAxis dataKey="range" stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
            <Tooltip content={<ChartTooltip title="Velocity bucket" />} />
            <Bar
              dataKey="count"
              name="Signals"
              fill="var(--color-info)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="ICP Fit vs Data Quality"
        subtitle="Prioritize high-fit accounts with clean data"
        href="/accounts"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" />
            <XAxis
              type="number"
              dataKey="dq"
              name="DQ"
              domain={[0, 100]}
              stroke="var(--color-muted-foreground)"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="icp"
              name="ICP"
              domain={[0, 100]}
              stroke="var(--color-muted-foreground)"
              tick={{ fontSize: 11 }}
            />
            <ZAxis type="number" dataKey="employees" range={[40, 220]} />
            <Tooltip
              cursor={{ strokeDasharray: "4 4" }}
              content={<ChartTooltip title="Account fit" />}
            />
            <Scatter data={icpVsDq} fill="var(--color-primary)" />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>
      </div>
    </section>
  );
}
