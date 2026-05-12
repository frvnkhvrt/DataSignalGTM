"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, Clock, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useCurrentOrg } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Stagger, StaggerItem } from "@/components/ui/motion";

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
    <Card className="bg-card/80 p-4 transition-colors hover:bg-surface-elevated/80">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-mono text-xl font-semibold text-foreground">
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
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

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="ds-heading text-2xl font-semibold text-foreground sm:text-3xl">
            AI Usage &amp; Costs
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Playbook generation activity for this organisation.
          </p>
        </div>
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
      </div>

      <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StaggerItem>
          <StatCard
            label="Total jobs"
            value={isLoading ? "—" : total}
            icon={<Activity className="h-3.5 w-3.5" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Succeeded"
            value={isLoading ? "—" : succeeded}
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-success" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Failed"
            value={isLoading ? "—" : failed}
            sub={total > 0 ? `${failRate}% failure rate` : undefined}
            icon={<XCircle className="h-3.5 w-3.5 text-destructive" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Avg duration"
            value={isLoading ? "—" : avgDuration != null ? `${avgDuration} ms` : "—"}
            icon={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Est. cost (USD)"
            value={isLoading ? "—" : `$${estimatedCost}`}
            sub="~$0.075 / 1M tokens"
            icon={<Activity className="h-3.5 w-3.5 text-muted-foreground" />}
          />
        </StaggerItem>
      </Stagger>

      <Card className="relative overflow-hidden bg-card/80 p-0">
        {isFetching && !isLoading && (
          <div className="absolute inset-x-0 top-0 h-px overflow-hidden bg-primary/10">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-primary shadow-glow" />
          </div>
        )}
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Recent jobs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-border bg-background/60">
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Duration</th>
                <th className="px-4 py-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? <TableSkeleton rows={5} columns={5} />
                : rows.slice(0, 50).map((row) => (
                    <tr key={row.id} className="ds-row hover:bg-surface-elevated/70">
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        {row.model}
                      </td>
                      <td className="px-4 py-3">
                        {row.success ? (
                          <Badge variant="success" shape="square">
                            <CheckCircle2 className="h-3 w-3" /> OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive" shape="square">
                            <XCircle className="h-3 w-3" /> Failed
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                        {row.duration_ms != null ? `${row.duration_ms} ms` : "—"}
                      </td>
                      <td className="max-w-[260px] truncate px-4 py-3 text-xs text-muted-foreground">
                        {row.error_message ?? "—"}
                      </td>
                    </tr>
                  ))}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10"
                  >
                    <EmptyState
                      icon={<Activity className="h-6 w-6" />}
                      title="No AI jobs yet"
                      description="Generate a playbook from Signals to see duration, success rate, and estimated cost here."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
