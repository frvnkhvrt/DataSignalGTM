"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Database, Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { AccountRow } from "@/lib/gtm-queries";
import {
  dqStatusLabel,
  dqTone,
  dataIssuesForAccountQuery,
  resolveGap,
  dismissGap,
  type DataIssueRow,
} from "@/lib/gtm-queries";

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
const SEVERITY_STYLES: Record<string, string> = {
  high: "border-red-500/40 text-red-300 bg-red-500/10",
  medium: "border-amber-500/40 text-amber-200 bg-amber-500/10",
  low: "border-zinc-600 text-zinc-400 bg-zinc-800/50",
};

export function DataIssuesPanel({
  account,
  onClose,
}: {
  account: AccountRow | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const tone = account ? dqTone(account.data_quality_score) : "good";
  const label = account ? dqStatusLabel(account.data_quality_score) : "HEALTHY";
  const scoreColor =
    tone === "good"
      ? "text-emerald-400"
      : tone === "warn"
        ? "text-amber-400"
        : "text-red-400";

  const { data: issues, isLoading } = useQuery({
    ...dataIssuesForAccountQuery(account?.id ?? ""),
    enabled: !!account,
  });

  const sorted = [...(issues ?? [])].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity ?? "low"] ?? 2) -
      (SEVERITY_ORDER[b.severity ?? "low"] ?? 2)
  );

  const resolveMut = useMutation({
    mutationFn: ({ id, suggestedFix }: { id: string; suggestedFix: string }) =>
      resolveGap(id, account?.name ?? "", suggestedFix),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["data-issues"] });
      toast.success("Gap resolved");
    },
    onError: () => toast.error("Failed to resolve gap"),
  });

  const dismissMut = useMutation({
    mutationFn: ({ id, suggestedFix }: { id: string; suggestedFix: string }) =>
      dismissGap(id, account?.name ?? "", suggestedFix),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["data-issues"] });
      toast.success("Gap dismissed");
    },
    onError: () => toast.error("Failed to dismiss gap"),
  });

  return (
    <Sheet open={!!account} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-zinc-950 border-l border-zinc-800 text-zinc-100 p-0"
      >
        <SheetHeader className="px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
            <Database className="h-3.5 w-3.5" />
            Data gaps
          </div>
          <SheetTitle className="text-zinc-100 text-base">
            {account?.name ?? ""}
          </SheetTitle>
        </SheetHeader>

        <div className="px-6 py-5 border-b border-zinc-800">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            DQ score
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-4xl font-semibold font-mono tabular-nums ${scoreColor}`}
            >
              {account?.data_quality_score ?? "—"}
            </span>
            <span className="text-sm text-zinc-500">/ 100</span>
            <span className="ml-2 text-xs font-medium text-zinc-400 border border-zinc-700 rounded px-2 py-0.5">
              {label}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 space-y-2 overflow-y-auto">
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
            Open issues ({sorted.length})
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 py-4 text-xs text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading issues…
            </div>
          )}

          {!isLoading && sorted.length === 0 && (
            <div className="py-6 text-center text-xs text-zinc-500">
              No data gaps detected for this account.
            </div>
          )}

          {sorted.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onResolve={() =>
                resolveMut.mutate({
                  id: issue.id,
                  suggestedFix: issue.suggested_fix ?? "",
                })
              }
              onDismiss={() =>
                dismissMut.mutate({
                  id: issue.id,
                  suggestedFix: issue.suggested_fix ?? "",
                })
              }
              busy={
                (resolveMut.isPending &&
                  resolveMut.variables?.id === issue.id) ||
                (dismissMut.isPending &&
                  dismissMut.variables?.id === issue.id)
              }
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function IssueCard({
  issue,
  onResolve,
  onDismiss,
  busy,
}: {
  issue: DataIssueRow;
  onResolve: () => void;
  onDismiss: () => void;
  busy: boolean;
}) {
  const sev = issue.severity ?? "low";
  const sevStyle = SEVERITY_STYLES[sev] ?? SEVERITY_STYLES.low;

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-sm font-medium text-zinc-100">
            {issue.field_name ?? "Unknown field"}
          </span>
          <span className="mx-2 text-zinc-600">·</span>
          <span className="text-xs text-zinc-400">
            {issue.issue_type?.replace(/_/g, " ") ?? "unknown"}
          </span>
        </div>
        <span
          className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase ${sevStyle}`}
        >
          {sev}
        </span>
      </div>

      {issue.suggested_fix && (
        <p className="text-xs text-zinc-400">{issue.suggested_fix}</p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onResolve}
          disabled={busy}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
        >
          <CheckCircle2 className="h-3 w-3" />
          Resolve
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={busy}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
        >
          <XCircle className="h-3 w-3" />
          Dismiss
        </button>
        {busy && <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />}
      </div>
    </div>
  );
}
