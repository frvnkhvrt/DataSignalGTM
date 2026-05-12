"use client";

import { useState, useMemo, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  Wrench,
  AlertTriangle,
  CircleAlert,
  Building2,
} from "lucide-react";
import { DataIssuesPanel } from "@/components/panels/data-issues-panel";
import { ReceiptPanel } from "@/components/panels/receipt-panel";
import {
  accountsByDqQuery,
  dataIssueCountsQuery,
  dqStatusLabel,
  dqTone,
  type AccountRow,
  type Tone,
} from "@/lib/gtm-queries";

type Filter = "all" | "healthy" | "held" | "critical";
const FILTERS: Filter[] = ["all", "healthy", "held", "critical"];

function matchesFilter(a: AccountRow, f: Filter): boolean {
  if (f === "all") return true;
  const dq = a.data_quality_score ?? 0;
  if (f === "healthy") return dq >= 90;
  if (f === "held") return dq >= 75 && dq < 90;
  return dq < 75;
}

export default function AccountsPage() {
  const { data: accounts, isLoading } = useQuery(accountsByDqQuery);
  const { data: issueCounts } = useQuery(dataIssueCountsQuery);
  const [gapsFor, setGapsFor] = useState<AccountRow | null>(null);
  const [receiptFor, setReceiptFor] = useState<{
    name: string;
    dq: number;
    icp?: number;
    industry?: string | null;
  } | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const issueMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of issueCounts ?? []) m.set(c.account_id, c.count);
    return m;
  }, [issueCounts]);

  const all = accounts ?? [];
  const counts: Record<Filter, number> = {
    all: all.length,
    healthy: all.filter((a) => matchesFilter(a, "healthy")).length,
    held: all.filter((a) => matchesFilter(a, "held")).length,
    critical: all.filter((a) => matchesFilter(a, "critical")).length,
  };

  const filtered = useMemo(
    () => all.filter((a) => matchesFilter(a, filter)),
    [all, filter]
  );

  const totalGaps = Array.from(issueMap.values()).reduce((s, c) => s + c, 0);

  function openPanel(a: AccountRow) {
    const dq = a.data_quality_score ?? 0;
    if (dq >= 90) {
      setReceiptFor({
        name: a.name,
        dq,
        icp: a.icp_fit_score ?? 0,
        industry: a.industry,
      });
    } else {
      setGapsFor(a);
    }
  }

  function rowKeyDown(e: KeyboardEvent, a: AccountRow) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPanel(a);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-[1400px] space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100">
        Accounts
      </h1>

      {/* ── Summary stats ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3"
            >
              <div className="h-3 w-16 rounded bg-zinc-800 animate-pulse" />
              <div className="h-6 w-10 rounded bg-zinc-800 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Total" value={counts.all} />
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
            accent={totalGaps > 0 ? "amber" : undefined}
            icon={<Wrench className="h-3.5 w-3.5 text-zinc-400" />}
          />
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              type="button"
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                active
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {f}{" "}
              <span
                className={`font-mono tabular-nums ${active ? "text-zinc-600" : "text-zinc-600"}`}
              >
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-x-auto">
        <table className="w-full text-sm min-w-[780px]">
          <thead className="bg-zinc-950 border-b border-zinc-800">
            <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-500">
              <Th className="w-12">#</Th>
              <Th>Account</Th>
              <Th>Industry</Th>
              <Th className="w-[180px]">DQ</Th>
              <Th className="text-right">ICP</Th>
              <Th>Status</Th>
              <Th className="text-right pr-4 sm:pr-5">Action</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <Td>
                    <div className="h-4 w-4 rounded bg-zinc-800 animate-pulse" />
                  </Td>
                  <Td>
                    <div className="space-y-1.5">
                      <div className="h-4 w-24 rounded bg-zinc-800 animate-pulse" />
                      <div className="h-3 w-32 rounded bg-zinc-800/60 animate-pulse" />
                    </div>
                  </Td>
                  <Td>
                    <div className="h-4 w-20 rounded bg-zinc-800 animate-pulse" />
                  </Td>
                  <Td>
                    <div className="h-1.5 w-full rounded-full bg-zinc-800 animate-pulse" />
                  </Td>
                  <Td>
                    <div className="h-4 w-6 rounded bg-zinc-800 animate-pulse ml-auto" />
                  </Td>
                  <Td>
                    <div className="h-5 w-16 rounded bg-zinc-800 animate-pulse" />
                  </Td>
                  <Td>
                    <div className="h-7 w-20 rounded bg-zinc-800 animate-pulse ml-auto" />
                  </Td>
                </tr>
              ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  <Building2 className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
                  <div className="text-xs text-zinc-500">
                    {all.length === 0
                      ? "No accounts in workspace."
                      : "No accounts match this filter."}
                  </div>
                </td>
              </tr>
            )}
            {filtered.map((a, i) => {
              const dq = a.data_quality_score ?? 0;
              const tone = dqTone(dq);
              const status = dqStatusLabel(dq);
              const isHealthy = dq >= 90;
              const gaps = issueMap.get(a.id) ?? 0;
              const isActive =
                gapsFor?.id === a.id || receiptFor?.name === a.name;
              const dqColor =
                tone === "good"
                  ? "text-emerald-400"
                  : tone === "warn"
                    ? "text-amber-400"
                    : "text-red-400";
              const barColor =
                tone === "good"
                  ? "bg-emerald-500"
                  : tone === "warn"
                    ? "bg-amber-500"
                    : "bg-red-500";

              const meta = [a.domain, a.employee_count != null ? `${a.employee_count.toLocaleString()} employees` : null]
                .filter(Boolean)
                .join(" \u00b7 ");

              return (
                <tr
                  key={a.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`${a.name}, DQ ${dq}`}
                  onClick={() => openPanel(a)}
                  onKeyDown={(e) => rowKeyDown(e, a)}
                  className={`cursor-pointer transition-colors outline-none focus-visible:ring-1 focus-visible:ring-zinc-600 ${
                    isActive
                      ? "bg-zinc-800/60 ring-1 ring-zinc-700"
                      : "hover:bg-zinc-800/40"
                  }`}
                >
                  <Td className="font-mono tabular-nums text-zinc-500">
                    {i + 1}
                  </Td>
                  <Td>
                    <div className="font-medium text-zinc-100">{a.name}</div>
                    {meta && (
                      <div className="text-[11px] text-zinc-500 mt-0.5 truncate max-w-[200px]">
                        {meta}
                      </div>
                    )}
                  </Td>
                  <Td className="text-zinc-400">{a.industry ?? "\u2014"}</Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor} transition-all`}
                          style={{ width: `${Math.min(100, dq)}%` }}
                        />
                      </div>
                      <span
                        className={`w-7 text-right font-mono tabular-nums text-xs font-medium ${dqColor}`}
                      >
                        {dq}
                      </span>
                    </div>
                  </Td>
                  <Td className="text-right font-mono tabular-nums text-zinc-300">
                    {a.icp_fit_score ?? 0}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <StatusChip tone={tone} label={status} />
                      {gaps > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-amber-300">
                          {gaps}
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td className="text-right pr-4 sm:pr-5">
                    {isHealthy ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReceiptFor({
                            name: a.name,
                            dq,
                            icp: a.icp_fit_score ?? 0,
                            industry: a.industry,
                          });
                        }}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-emerald-400 text-zinc-950 font-medium hover:bg-emerald-300 transition-colors"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Playbook
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setGapsFor(a);
                        }}
                        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium border transition-colors ${
                          tone === "bad"
                            ? "border-red-500/40 text-red-300 hover:bg-red-500/10"
                            : "border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
                        }`}
                      >
                        <Wrench className="h-3.5 w-3.5" />
                        Review gaps
                      </button>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <DataIssuesPanel account={gapsFor} onClose={() => setGapsFor(null)} />
      <ReceiptPanel account={receiptFor} onClose={() => setReceiptFor(null)} />
    </div>
  );
}

/* ── Helpers ── */

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent?: "emerald" | "amber" | "red";
  icon?: React.ReactNode;
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
      <div
        className={`mt-2 text-xl font-semibold font-mono tabular-nums ${valueColor}`}
      >
        {value}
      </div>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-3 sm:px-4 py-3 font-medium ${className}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 sm:px-4 py-3 ${className}`}>{children}</td>;
}

function StatusChip({ tone, label }: { tone: Tone; label: string }) {
  const styles =
    tone === "good"
      ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
      : tone === "warn"
        ? "border-amber-500/40 text-amber-200 bg-amber-500/10"
        : "border-red-500/40 text-red-300 bg-red-500/10";
  const Icon = tone === "good" ? ShieldCheck : AlertTriangle;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium uppercase ${styles}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}
