"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, Clock, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useCurrentOrg } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { QueryError } from "@/components/ui/query-error";

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

type TimeWindow = 7 | 30 | 90;
const WINDOWS: TimeWindow[] = [7, 30, 90];

export default function UsagePage() {
  const org = useCurrentOrg();
  const [window, setWindow] = useState<TimeWindow>(7);
  const {
    data: rows = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery(usageQuery(org.id, window));

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

  if (isError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <QueryError
          message="Could not load AI usage data. Check your connection and try again."
          onRetry={() => void refetch()}
          className="mx-auto max-w-lg"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Operations"
        title="AI Usage &amp; Costs"
        description="Playbook generation activity for this organisation."
        actions={
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            {WINDOWS.map((w) => (
              <Button
                key={w}
                type="button"
                onClick={() => setWindow(w)}
                variant={window === w ? "secondary" : "ghost"}
                size="xs"
                className={
                  window === w
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : undefined
                }
              >
                {w}d
              </Button>
            ))}
          </div>
        }
      />

      <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StaggerItem>
          <KpiCard
            label="Total jobs"
            value={isLoading ? "—" : total}
            icon={<Activity className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Succeeded"
            value={isLoading ? "—" : succeeded}
            tone="success"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Failed"
            value={isLoading ? "—" : failed}
            tone={failed > 0 ? "destructive" : "default"}
            sub={total > 0 ? `${failRate}% failure rate` : undefined}
            icon={<XCircle className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Avg duration"
            value={isLoading ? "—" : avgDuration != null ? `${avgDuration} ms` : "—"}
            icon={<Clock className="h-4 w-4" />}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Est. cost (USD)"
            value={isLoading ? "—" : `$${estimatedCost}`}
            sub="~$0.075 / 1M tokens"
            icon={<Activity className="h-4 w-4" />}
          />
        </StaggerItem>
      </Stagger>

      {/* Refetch strip */}
      {isFetching && !isLoading && (
        <p className="text-xs text-muted-foreground">Refreshing…</p>
      )}

      {/* Usage table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card/80">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-foreground">Generation log</p>
        </div>
        <table className="w-full text-sm" aria-busy={isLoading}>
          <thead className="border-b border-border bg-background/60">
            <tr>
              {["Time", "Model", "Status", "Duration", "Error"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <TableSkeleton rows={6} columns={5} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <EmptyState
                    icon={<Activity className="h-6 w-6" />}
                    title="No usage data"
                    description={`No playbook jobs in the last ${window} days.`}
                    className="mx-auto max-w-xs border-0 bg-transparent shadow-none"
                  />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="ds-row hover:bg-surface-elevated/50">
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">
                    {row.model}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={row.success ? "success" : "destructive"}>
                      {row.success ? "OK" : "Failed"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {row.duration_ms != null ? `${row.duration_ms} ms` : "—"}
                  </td>
                  <td className="max-w-[18rem] truncate px-4 py-3 text-xs text-destructive">
                    {row.error_message ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
