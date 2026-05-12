"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Database,
  Loader2,
  CheckCircle2,
  XCircle,
  Phone,
  User,
  Linkedin,
  Clock,
  Mail,
  HelpCircle,
} from "lucide-react";
import type { AccountRow, DataIssueCount, DataIssueRow } from "@/lib/gtm-queries";
import {
  accountsByDqQuery,
  dqStatusLabel,
  dqTone,
  dataIssueCountsQuery,
  dataIssuesForAccountQuery,
  resolveGap,
  dismissGap,
  resolveAllGaps,
} from "@/lib/gtm-queries";

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

const SEVERITY_BORDER: Record<string, string> = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-zinc-600",
};

const SEVERITY_BADGE: Record<string, string> = {
  high: "border-red-500/40 text-red-300 bg-red-500/10",
  medium: "border-amber-500/40 text-amber-200 bg-amber-500/10",
  low: "border-zinc-600 text-zinc-400 bg-zinc-800/50",
};

const ISSUE_TYPE_LABEL: Record<string, string> = {
  missing: "Missing",
  stale: "Stale",
  invalid: "Invalid",
};

function fieldIcon(field: string | null) {
  const f = (field ?? "").toLowerCase();
  if (f.includes("phone")) return <Phone className="h-3.5 w-3.5" />;
  if (f.includes("job") || f.includes("title"))
    return <User className="h-3.5 w-3.5" />;
  if (f.includes("linkedin")) return <Linkedin className="h-3.5 w-3.5" />;
  if (f.includes("contact") || f.includes("last"))
    return <Clock className="h-3.5 w-3.5" />;
  if (f.includes("email")) return <Mail className="h-3.5 w-3.5" />;
  return <HelpCircle className="h-3.5 w-3.5" />;
}

export function DataIssuesPanel({
  account,
  onClose,
}: {
  account: AccountRow | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: cachedAccounts } = useQuery(accountsByDqQuery);
  const liveAccount = account?.id
    ? (cachedAccounts?.find((a) => a.id === account.id) ?? account)
    : account;
  const tone = liveAccount ? dqTone(liveAccount.data_quality_score) : "good";
  const label = liveAccount
    ? dqStatusLabel(liveAccount.data_quality_score)
    : "HEALTHY";
  const dq = liveAccount?.data_quality_score ?? 0;

  const ringColor =
    tone === "good"
      ? "stroke-emerald-500"
      : tone === "warn"
        ? "stroke-amber-500"
        : "stroke-red-500";
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

  const highCount = sorted.filter((i) => i.severity === "high").length;
  const medCount = sorted.filter((i) => i.severity === "medium").length;
  const lowCount = sorted.filter((i) => i.severity === "low").length;

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["data-issues"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  };

  type MutCtx = {
    queryKey: QueryKey;
    prevIssues?: DataIssueRow[];
    prevCounts?: DataIssueCount[];
    accountSnapshots: [QueryKey, AccountRow[] | undefined][];
  };

  const snapshotForOptimisticUpdate = async (queryKey: QueryKey) => {
    await qc.cancelQueries({ queryKey });
    await qc.cancelQueries({ queryKey: ["accounts"] });
    await qc.cancelQueries({ queryKey: dataIssueCountsQuery.queryKey });

    return {
      queryKey,
      prevIssues: qc.getQueryData<DataIssueRow[]>(queryKey),
      prevCounts: qc.getQueryData<DataIssueCount[]>(dataIssueCountsQuery.queryKey),
      accountSnapshots: qc.getQueriesData<AccountRow[]>({
        queryKey: ["accounts"],
      }),
    };
  };

  const restoreOptimisticUpdate = (ctx?: MutCtx) => {
    if (!ctx) return;
    qc.setQueryData(ctx.queryKey, ctx.prevIssues);
    qc.setQueryData(dataIssueCountsQuery.queryKey, ctx.prevCounts);
    for (const [queryKey, data] of ctx.accountSnapshots) {
      qc.setQueryData(queryKey, data);
    }
  };

  const updateAccountScore = (accountId: string, score: number | null) => {
    qc.setQueriesData<AccountRow[]>({ queryKey: ["accounts"] }, (old) =>
      old?.map((a) =>
        a.id === accountId ? { ...a, data_quality_score: score } : a
      )
    );
  };

  const adjustAccountScore = (accountId: string, delta: number) => {
    qc.setQueriesData<AccountRow[]>({ queryKey: ["accounts"] }, (old) =>
      old?.map((a) => {
        if (a.id !== accountId) return a;
        const next = Math.max(
          0,
          Math.min(100, (a.data_quality_score ?? 0) + delta)
        );
        return { ...a, data_quality_score: next };
      })
    );
  };

  const setIssueCount = (accountId: string, count: number) => {
    qc.setQueryData<DataIssueCount[]>(dataIssueCountsQuery.queryKey, (old) => {
      if (!old) return old;
      return old
        .map((c) =>
          c.account_id === accountId ? { ...c, count: Math.max(0, count) } : c
        )
        .filter((c) => c.count > 0);
    });
  };

  const decrementIssueCount = (accountId: string, by = 1) => {
    qc.setQueryData<DataIssueCount[]>(dataIssueCountsQuery.queryKey, (old) => {
      if (!old) return old;
      return old
        .map((c) =>
          c.account_id === accountId
            ? { ...c, count: Math.max(0, c.count - by) }
            : c
        )
        .filter((c) => c.count > 0);
    });
  };

  const resolveMut = useMutation({
    mutationFn: ({ issue }: { issue: DataIssueRow }) => resolveGap(issue.id),
    onMutate: async ({ issue }) => {
      const queryKey = ["data-issues", account?.id ?? ""];
      const ctx = await snapshotForOptimisticUpdate(queryKey);
      qc.setQueryData<DataIssueRow[]>(queryKey, (old) =>
        old ? old.filter((i) => i.id !== issue.id) : old
      );
      const accountId = issue.account_id ?? account?.id;
      if (accountId) {
        decrementIssueCount(accountId);
        adjustAccountScore(accountId, issue.score_impact ?? 0);
      }
      return ctx;
    },
    onError: (_e, _v, ctx) => {
      restoreOptimisticUpdate(ctx);
      toast.error("Failed to resolve gap");
    },
    onSuccess: (result) => {
      if (result) updateAccountScore(result.account_id, result.data_quality_score);
      toast.success("Gap resolved");
    },
    onSettled: invalidateAll,
  });

  const dismissMut = useMutation({
    mutationFn: ({ issue }: { issue: DataIssueRow }) => dismissGap(issue.id),
    onMutate: async ({ issue }) => {
      const queryKey = ["data-issues", account?.id ?? ""];
      const ctx = await snapshotForOptimisticUpdate(queryKey);
      qc.setQueryData<DataIssueRow[]>(queryKey, (old) =>
        old ? old.filter((i) => i.id !== issue.id) : old
      );
      const accountId = issue.account_id ?? account?.id;
      if (accountId) decrementIssueCount(accountId);
      return ctx;
    },
    onError: (_e, _v, ctx) => {
      restoreOptimisticUpdate(ctx);
      toast.error("Failed to dismiss gap");
    },
    onSuccess: (result) => {
      if (result) updateAccountScore(result.account_id, result.data_quality_score);
      toast.success("Gap dismissed");
    },
    onSettled: invalidateAll,
  });

  const resolveAllMut = useMutation({
    mutationFn: () => {
      if (!account?.id) throw new Error("Account is required");
      return resolveAllGaps(account.id);
    },
    onMutate: async () => {
      const queryKey = ["data-issues", account?.id ?? ""];
      const ctx = await snapshotForOptimisticUpdate(queryKey);
      qc.setQueryData<DataIssueRow[]>(queryKey, () => []);
      if (account?.id) {
        setIssueCount(account.id, 0);
        adjustAccountScore(
          account.id,
          sorted.reduce((sum, i) => sum + (i.score_impact ?? 0), 0)
        );
      }
      return ctx;
    },
    onError: (_e, _v, ctx) => {
      restoreOptimisticUpdate(ctx);
      toast.error("Failed to resolve all gaps");
    },
    onSuccess: (result) => {
      if (result && account?.id) {
        updateAccountScore(account.id, result.data_quality_score);
      }
      toast.success("All gaps resolved");
    },
    onSettled: invalidateAll,
  });

  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (dq / 100) * circumference;

  return (
    <Sheet open={!!account} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-zinc-950 border-l border-zinc-800 text-zinc-100 p-0 flex flex-col"
      >
        {/* ── Fixed header ── */}
        <SheetHeader className="px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
            <Database className="h-3.5 w-3.5" />
            Data gaps
          </div>
          <SheetTitle className="text-zinc-100 text-base">
            {liveAccount?.name ?? ""}
          </SheetTitle>
        </SheetHeader>

        {/* ── DQ ring + severity breakdown ── */}
        <div className="px-6 py-5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-6">
            {/* Ring gauge */}
            <div className="relative shrink-0">
              <svg width="88" height="88" viewBox="0 0 88 88">
                <circle
                  cx="44"
                  cy="44"
                  r="40"
                  fill="none"
                  strokeWidth="6"
                  className="stroke-zinc-800"
                />
                <circle
                  cx="44"
                  cy="44"
                  r="40"
                  fill="none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className={ringColor}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  transform="rotate(-90 44 44)"
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-xl font-semibold font-mono tabular-nums ${scoreColor}`}
                >
                  {dq}
                </span>
                <span className="text-[9px] uppercase tracking-wide text-zinc-500">
                  DQ
                </span>
              </div>
            </div>

            {/* Score details */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-400 border border-zinc-700 rounded px-2 py-0.5">
                  {label}
                </span>
              </div>
              {sorted.length > 0 && (
                <div className="flex items-center gap-3 text-[11px]">
                  {highCount > 0 && (
                    <span className="flex items-center gap-1 text-red-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      {highCount} high
                    </span>
                  )}
                  {medCount > 0 && (
                    <span className="flex items-center gap-1 text-amber-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {medCount} med
                    </span>
                  )}
                  {lowCount > 0 && (
                    <span className="flex items-center gap-1 text-zinc-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                      {lowCount} low
                    </span>
                  )}
                </div>
              )}
              {sorted.length > 0 && (
                <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-zinc-800">
                  {highCount > 0 && (
                    <div
                      className="h-full bg-red-500"
                      style={{
                        width: `${(highCount / sorted.length) * 100}%`,
                      }}
                    />
                  )}
                  {medCount > 0 && (
                    <div
                      className="h-full bg-amber-500"
                      style={{
                        width: `${(medCount / sorted.length) * 100}%`,
                      }}
                    />
                  )}
                  {lowCount > 0 && (
                    <div
                      className="h-full bg-zinc-600"
                      style={{
                        width: `${(lowCount / sorted.length) * 100}%`,
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Resolve all bar ── */}
        {sorted.length >= 2 && (
          <div className="px-6 py-3 border-b border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => resolveAllMut.mutate()}
              disabled={resolveAllMut.isPending}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50 transition-colors w-full justify-center"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {resolveAllMut.isPending
                ? "Resolving…"
                : `Resolve all (${sorted.length})`}
            </button>
          </div>
        )}

        {/* ── Scrollable issue list ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
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
            <div className="py-10 text-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500/40 mx-auto mb-2" />
              <div className="text-xs text-zinc-500">
                No data gaps detected for this account.
              </div>
            </div>
          )}

          {sorted.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onResolve={() =>
                resolveMut.mutate({
                  issue,
                })
              }
              onDismiss={() =>
                dismissMut.mutate({
                  issue,
                })
              }
              busy={
                resolveAllMut.isPending ||
                (resolveMut.isPending &&
                  resolveMut.variables?.issue.id === issue.id) ||
                (dismissMut.isPending &&
                  dismissMut.variables?.issue.id === issue.id)
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
  const sevBadge = SEVERITY_BADGE[sev] ?? SEVERITY_BADGE.low;
  const borderClass = SEVERITY_BORDER[sev] ?? SEVERITY_BORDER.low;
  const typeLabel = ISSUE_TYPE_LABEL[issue.issue_type ?? ""] ?? issue.issue_type?.replace(/_/g, " ") ?? "unknown";

  return (
    <div
      className={`rounded-md border border-zinc-800 border-l-[3px] ${borderClass} bg-zinc-900 p-3 space-y-2`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-zinc-400 shrink-0">
            {fieldIcon(issue.field_name)}
          </span>
          <div className="min-w-0">
            <span className="text-sm font-medium text-zinc-100">
              {issue.field_name ?? "Unknown field"}
            </span>
            <span className="mx-1.5 text-zinc-600">·</span>
            <span className="text-xs text-zinc-400">{typeLabel}</span>
          </div>
        </div>
        <span
          className={`inline-flex items-center shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase ${sevBadge}`}
        >
          {sev}
        </span>
      </div>

      {issue.suggested_fix && (
        <p className="text-xs text-zinc-400 leading-relaxed pl-6">
          {issue.suggested_fix}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1 pl-6">
        <button
          type="button"
          onClick={onResolve}
          disabled={busy}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50 transition-colors"
        >
          <CheckCircle2 className="h-3 w-3" />
          Resolve
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={busy}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          <XCircle className="h-3 w-3" />
          Dismiss
        </button>
        {busy && <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />}
      </div>
    </div>
  );
}
