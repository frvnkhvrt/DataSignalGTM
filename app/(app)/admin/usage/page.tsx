"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, Clock, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useCurrentOrg } from "@/lib/auth-context";

type UsageRow = {
  id: string;
  model: string;
  success: boolean;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
};

function usageQuery(orgId: string, days: number) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  return {
    queryKey: ["org", orgId, "ai-usage", days],
    queryFn: async (): Promise<UsageRow[]> => {
      const { data, error } = await supabase
        .from("ai_usage")
        .select("id,model,success,duration_ms,error_message,created_at")
        .eq("org_id", orgId)
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UsageRow[];
    },
  };
}

// Rough Gemini Flash Lite pricing (May 2026): ~$0.075 per 1M input tokens.
// We estimate ~2 000 tokens per playbook.
const ESTIMATED_TOKENS_PER_PLAYBOOK = 2_000;
const PRICE_PER_1M_TOKENS = 0.075;

function estimateCost(count: number) {
  return ((count * ESTIMATED_TOKENS_PER_PLAYBOOK) / 1_000_000) * PRICE_PER_1M_TOKENS;
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-zinc-500">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-mono text-xl font-semibold text-zinc-100">
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

type TimeWindow = 7 | 30 | 90;
const WINDOWS: TimeWindow[] = [7, 30, 90];

export default function UsagePage() {
  const org = useCurrentOrg();
  const [window, setWindow] = useState<TimeWindow>(7);
  const { data: rows = [], isLoading } = useQuery(usageQuery(org.id, window));

  const total = rows.length;
  const succeeded = rows.filter((r) => r.success).length;
  const failed = total - succeeded;
  const failRate = total > 0 ? Math.round((failed / total) * 100) : 0;
  const durRows = rows.filter((r) => r.duration_ms != null);
  const avgDuration =
    durRows.length > 0
      ? Math.round(
          durRows.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / durRows.length
        )
      : null;
  const estimatedCost = estimateCost(succeeded).toFixed(4);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 sm:text-2xl">
            AI Usage &amp; Costs
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Playbook generation activity for this organisation.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          {WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWindow(w)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                window === w
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {w}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total jobs"
          value={isLoading ? "—" : total}
          icon={<Activity className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Succeeded"
          value={isLoading ? "—" : succeeded}
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
        />
        <StatCard
          label="Failed"
          value={isLoading ? "—" : failed}
          sub={total > 0 ? `${failRate}% failure rate` : undefined}
          icon={<XCircle className="h-3.5 w-3.5 text-red-400" />}
        />
        <StatCard
          label="Avg duration"
          value={isLoading ? "—" : avgDuration != null ? `${avgDuration} ms` : "—"}
          icon={<Clock className="h-3.5 w-3.5 text-zinc-400" />}
        />
        <StatCard
          label="Est. cost (USD)"
          value={isLoading ? "—" : `$${estimatedCost}`}
          sub="~$0.075 / 1M tokens"
          icon={<Activity className="h-3.5 w-3.5 text-zinc-400" />}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-100">Recent jobs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950">
              <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Duration</th>
                <th className="px-4 py-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 animate-pulse rounded bg-zinc-800" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.slice(0, 50).map((row) => (
                    <tr key={row.id} className="hover:bg-zinc-800/40">
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                        {row.model}
                      </td>
                      <td className="px-4 py-3">
                        {row.success ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-red-300">
                            <XCircle className="h-3 w-3" /> Failed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-zinc-400">
                        {row.duration_ms != null ? `${row.duration_ms} ms` : "—"}
                      </td>
                      <td className="max-w-[260px] truncate px-4 py-3 text-xs text-zinc-500">
                        {row.error_message ?? "—"}
                      </td>
                    </tr>
                  ))}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-xs text-zinc-500"
                  >
                    No AI jobs recorded in this window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
