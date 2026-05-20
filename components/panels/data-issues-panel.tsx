"use client";

import * as React from "react";
import { useEffect } from "react";

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
  CheckCircle2,
  XCircle,
  Phone,
  User,
  Linkedin,
  Clock,
  Mail,
  HelpCircle,
} from "lucide-react";
import { useCurrentOrg } from "@/lib/auth-context";
import { useInvalidateOrgGtm } from "@/hooks/use-invalidate-org";
import { orgQueryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MotionListItem, spring } from "@/components/ui/motion";
import type {
  AccountRow,
  DataIssueCount,
  DataIssueRow,
} from "@/lib/gtm-queries";
import {
  dismissGapAction,
  resolveAllGapsAction,
  resolveGapAction,
} from "@/app/actions/data-issues";
import { unwrapActionResult } from "@/lib/actions/result";
import {
  accountsByDqQuery,
  dqStatusLabel,
  dqTone,
  dataIssueCountsQuery,
  dataIssuesForAccountQuery,
} from "@/lib/gtm-queries";
import { DemoLimitedAction } from "@/components/demo/demo-limited-action";

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

const SEVERITY_BORDER: Record<string, string> = {
  high: "border-l-destructive",
  medium: "border-l-warning",
  low: "border-l-border",
};

const SEVERITY_VARIANT: Record<string, "destructive" | "warning" | "muted"> = {
  high: "destructive",
  medium: "warning",
  low: "muted",
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
  const org = useCurrentOrg();
  const keys = orgQueryKeys(org.id);
  const accountsQuery = accountsByDqQuery(org.id);
  const countsQuery = dataIssueCountsQuery(org.id);
  const qc = useQueryClient();
  const { invalidateOrgGtm: invalidateGtm } = useInvalidateOrgGtm(org.id);
  const { data: cachedAccounts } = useQuery(accountsQuery);
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
      ? "stroke-success"
      : tone === "warn"
        ? "stroke-warning"
        : "stroke-destructive";
  const scoreColor =
    tone === "good"
      ? "text-success"
      : tone === "warn"
        ? "text-warning"
        : "text-destructive";

  const { data: issues, isLoading } = useQuery({
    ...dataIssuesForAccountQuery(org.id, account?.id ?? ""),
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
    invalidateGtm(["data-issues", "accounts"]);
  };

  type MutCtx = {
    queryKey: QueryKey;
    prevIssues?: DataIssueRow[];
    prevCounts?: DataIssueCount[];
    accountSnapshots: [QueryKey, AccountRow[] | undefined][];
  };

  const snapshotForOptimisticUpdate = async (queryKey: QueryKey) => {
    await qc.cancelQueries({ queryKey });
    await qc.cancelQueries({ queryKey: keys.accounts.all });
    await qc.cancelQueries({ queryKey: countsQuery.queryKey });

    return {
      queryKey,
      prevIssues: qc.getQueryData<DataIssueRow[]>(queryKey),
      prevCounts: qc.getQueryData<DataIssueCount[]>(countsQuery.queryKey),
      accountSnapshots: qc.getQueriesData<AccountRow[]>({
        queryKey: keys.accounts.all,
      }),
    };
  };

  const restoreOptimisticUpdate = (ctx?: MutCtx) => {
    if (!ctx) return;
    qc.setQueryData(ctx.queryKey, ctx.prevIssues);
    qc.setQueryData(countsQuery.queryKey, ctx.prevCounts);
    for (const [queryKey, data] of ctx.accountSnapshots) {
      qc.setQueryData(queryKey, data);
    }
  };

  const updateAccountScore = (accountId: string, score: number | null) => {
    qc.setQueriesData<AccountRow[]>({ queryKey: keys.accounts.all }, (old) =>
      old?.map((a) =>
        a.id === accountId ? { ...a, data_quality_score: score } : a
      )
    );
  };

  const adjustAccountScore = (accountId: string, delta: number) => {
    qc.setQueriesData<AccountRow[]>({ queryKey: keys.accounts.all }, (old) =>
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
    qc.setQueryData<DataIssueCount[]>(countsQuery.queryKey, (old) => {
      if (!old) return old;
      return old
        .map((c) =>
          c.account_id === accountId ? { ...c, count: Math.max(0, count) } : c
        )
        .filter((c) => c.count > 0);
    });
  };

  const decrementIssueCount = (accountId: string, by = 1) => {
    qc.setQueryData<DataIssueCount[]>(countsQuery.queryKey, (old) => {
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
    mutationFn: async ({ issue }: { issue: DataIssueRow }) =>
      unwrapActionResult(await resolveGapAction(issue.id)),
    onMutate: async ({ issue }) => {
      const queryKey = keys.dataIssues.forAccount(account?.id ?? "");
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
    mutationFn: async ({ issue }: { issue: DataIssueRow }) =>
      unwrapActionResult(await dismissGapAction(issue.id)),
    onMutate: async ({ issue }) => {
      const queryKey = keys.dataIssues.forAccount(account?.id ?? "");
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
    mutationFn: async () => {
      if (!account?.id) throw new Error("Account is required");
      return unwrapActionResult(await resolveAllGapsAction(account.id));
    },
    onMutate: async () => {
      const queryKey = keys.dataIssues.forAccount(account?.id ?? "");
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
  const reduced = useReducedMotion();

  // Ring draw-in: start unmounted (full circle), defer to rAF for the
  // transition to kick in. A ref avoids the lint issue with setState in
  // an effect body — the key on the ring container forces remount on
  // account change, which naturally resets the animation.
  const ringRef = React.useRef<SVGCircleElement>(null);
  useEffect(() => {
    const el = ringRef.current;
    if (!el) return;
    // Start at full circumference (empty ring), then transition to target
    el.style.strokeDashoffset = String(circumference);
    const raf = requestAnimationFrame(() => {
      el.style.strokeDashoffset = String(offset);
    });
    return () => cancelAnimationFrame(raf);
  }, [circumference, offset]);

  return (
    <Sheet open={!!account} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-card border-l border-border text-card-foreground p-0 flex flex-col"
      >
        {/* ── Fixed header ── */}
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Database className="h-3.5 w-3.5" />
            Data gaps
          </div>
          <SheetTitle className="text-foreground text-base">
            {liveAccount?.name ?? ""}
          </SheetTitle>
        </SheetHeader>

        {/* ── DQ ring + severity breakdown ── */}
        <div className="px-6 py-5 border-b border-border shrink-0">
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
                  className="stroke-border"
                />
                <circle
                  ref={ringRef}
                  cx="44"
                  cy="44"
                  r="40"
                  fill="none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className={cn(ringColor, "ds-ring-dash")}
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference}
                  transform="rotate(-90 44 44)"
                />
              </svg>
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center"
                key={account?.id ?? "dq-score"}
                initial={reduced ? {} : { opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={reduced ? { duration: 0 } : spring.metricPop}
              >
                <span
                  className={`text-xl font-semibold font-mono tabular-nums ${scoreColor}`}
                >
                  {dq}
                </span>
                <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                  DQ
                </span>
              </motion.div>
            </div>

            {/* Score details */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    tone === "good"
                      ? "success"
                      : tone === "warn"
                        ? "warning"
                        : "destructive"
                  }
                  shape="square"
                  className="text-[10px] uppercase"
                >
                  {label}
                </Badge>
              </div>
              {sorted.length > 0 && (
                <div className="flex items-center gap-3 text-[11px]">
                  {highCount > 0 && (
                    <span className="flex items-center gap-1 text-destructive">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                      {highCount} high
                    </span>
                  )}
                  {medCount > 0 && (
                    <span className="flex items-center gap-1 text-warning">
                      <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                      {medCount} med
                    </span>
                  )}
                  {lowCount > 0 && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                      {lowCount} low
                    </span>
                  )}
                </div>
              )}
              {sorted.length > 0 && (
                <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  {highCount > 0 && (
                    <div
                      className="h-full bg-destructive"
                      style={{
                        width: `${(highCount / sorted.length) * 100}%`,
                      }}
                    />
                  )}
                  {medCount > 0 && (
                    <div
                      className="h-full bg-warning"
                      style={{
                        width: `${(medCount / sorted.length) * 100}%`,
                      }}
                    />
                  )}
                  {lowCount > 0 && (
                    <div
                      className="h-full bg-muted-foreground/40"
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
          <div className="shrink-0 border-b border-border px-6 py-3">
            <DemoLimitedAction
              action="resolve_all_data_issues"
              surface="data_issues_panel"
              wrapperClassName="w-full"
            >
              <Button
                type="button"
                variant="success"
                size="sm"
                onClick={() => resolveAllMut.mutate()}
                disabled={resolveAllMut.isPending}
                className="w-full"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {resolveAllMut.isPending
                  ? "Resolving..."
                  : `Resolve all (${sorted.length})`}
              </Button>
            </DemoLimitedAction>
          </div>
        )}

        {/* ── Scrollable issue list ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Open issues ({sorted.length})
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
              <Spinner size="md" />
              Loading issues…
            </div>
          )}

          {!isLoading && sorted.length === 0 && (
            <div className="py-10 text-center">
              <div className="ds-empty-orb ds-empty-orb-glow mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-success/20 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium text-foreground mb-1">
                All clear
              </div>
              <div className="text-xs text-muted-foreground">
                No data gaps detected for this account.
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {sorted.map((issue) => (
              <MotionListItem key={issue.id}>
                <IssueCard
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
              </MotionListItem>
            ))}
          </AnimatePresence>
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
  const sevVariant = SEVERITY_VARIANT[sev] ?? SEVERITY_VARIANT.low;
  const borderClass = SEVERITY_BORDER[sev] ?? SEVERITY_BORDER.low;
  const typeLabel = ISSUE_TYPE_LABEL[issue.issue_type ?? ""] ?? issue.issue_type?.replace(/_/g, " ") ?? "unknown";

  return (
    <div
      className={`rounded-md border border-border border-l-[3px] ${borderClass} bg-background/60 p-3 space-y-2 transition-[background-color,border-color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] hover:bg-surface-elevated/60 hover:border-border/80`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-muted-foreground shrink-0">
            {fieldIcon(issue.field_name)}
          </span>
          <div className="min-w-0">
            <span className="text-sm font-medium text-foreground">
              {issue.field_name ?? "Unknown field"}
            </span>
            <span className="mx-1.5 text-border">·</span>
            <span className="text-xs text-muted-foreground">{typeLabel}</span>
          </div>
        </div>
        <Badge
          variant={sevVariant}
          shape="square"
          className="shrink-0 text-[10px] uppercase"
        >
          {sev}
        </Badge>
      </div>

      {issue.suggested_fix && (
        <p className="text-xs text-muted-foreground leading-relaxed pl-6">
          {issue.suggested_fix}
        </p>
      )}

      <div className="flex items-center gap-2 pl-6 pt-1">
        <DemoLimitedAction action="resolve_data_issue" surface="data_issues_panel">
          <Button
            type="button"
            variant="success"
            size="xs"
            onClick={onResolve}
            disabled={busy}
          >
            <CheckCircle2 className="h-3 w-3" />
            Resolve
          </Button>
        </DemoLimitedAction>
        <DemoLimitedAction action="dismiss_data_issue" surface="data_issues_panel">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={onDismiss}
            disabled={busy}
          >
            <XCircle className="h-3 w-3" />
            Dismiss
          </Button>
        </DemoLimitedAction>
        {busy && <Spinner size="sm" muted />}
      </div>
    </div>
  );
}
