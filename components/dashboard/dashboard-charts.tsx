"use client";

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
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
      </div>
      <div className="mt-4 h-64">{children}</div>
    </section>
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

  const tooltipStyle = {
    background: "#09090b",
    border: "1px solid #27272a",
    borderRadius: "0.5rem",
    color: "#e4e4e7",
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <ChartCard
        title="DQ Score Trend"
        subtitle="Running average by account creation order"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dqTrend}>
            <CartesianGrid stroke="#27272a" strokeDasharray="4 4" />
            <XAxis dataKey="label" stroke="#71717a" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} stroke="#71717a" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="dq"
              stroke="#34d399"
              strokeWidth={2}
              dot={{ r: 2, fill: "#34d399" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Velocity Distribution"
        subtitle="Signals grouped by velocity score"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={velocityDistribution}>
            <CartesianGrid stroke="#27272a" strokeDasharray="4 4" />
            <XAxis dataKey="range" stroke="#71717a" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} stroke="#71717a" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill="#60a5fa" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="ICP Fit vs Data Quality"
        subtitle="Prioritize high-fit accounts with clean data"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid stroke="#27272a" strokeDasharray="4 4" />
            <XAxis
              type="number"
              dataKey="dq"
              name="DQ"
              domain={[0, 100]}
              stroke="#71717a"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="icp"
              name="ICP"
              domain={[0, 100]}
              stroke="#71717a"
              tick={{ fontSize: 11 }}
            />
            <ZAxis type="number" dataKey="employees" range={[40, 220]} />
            <Tooltip
              cursor={{ strokeDasharray: "4 4" }}
              contentStyle={tooltipStyle}
              formatter={(value, name) => [value, String(name).toUpperCase()]}
            />
            <Scatter data={icpVsDq} fill="#a78bfa" />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
