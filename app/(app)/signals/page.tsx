"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  approveSignal,
  rejectSignal,
  isTransitionError,
  signalsRecentQuery,
  type SignalRow,
} from "@/lib/gtm-queries";
import { SourceBadge } from "@/components/source-badge";
import { ReceiptPanel } from "@/components/panels/receipt-panel";
import type { SignalStatus } from "@/types/signal";
import { canTransition, isTerminal } from "@/types/signal";

type Filter = "all" | "pending" | "held" | "approved" | "rejected";

const FILTERS: Filter[] = ["all", "pending", "held", "approved", "rejected"];

export default function SignalsPage() {
  const { data: signals, isLoading } = useQuery(signalsRecentQuery);
  const [receiptFor, setReceiptFor] = useState<{ name: string } | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = (signals ?? []).filter((s) =>
    filter === "all" ? true : s.status === filter
  );
  const counts: Record<Filter, number> = {
    all: signals?.length ?? 0,
    pending: signals?.filter((s) => s.status === "pending").length ?? 0,
    held: signals?.filter((s) => s.status === "held").length ?? 0,
    approved: signals?.filter((s) => s.status === "approved").length ?? 0,
    rejected: signals?.filter((s) => s.status === "rejected").length ?? 0,
  };
  const qc = useQueryClient();

  const approve = useMutation({
    mutationFn: (name: string) => approveSignal(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["signals"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (e) =>
      isTransitionError(e) ? toast.info(e.message) : toast.error("Approve failed"),
  });

  const rejectMut = useMutation({
    mutationFn: (name: string) => rejectSignal(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["signals"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (e) =>
      isTransitionError(e) ? toast.info(e.message) : toast.error("Reject failed"),
  });

  function tryApprove(name: string) {
    const sig = signals?.find((s) => s.account_name === name);
    const cached = (sig?.status ?? "pending") as SignalStatus;
    if (isTerminal(cached)) {
      toast.info(`Signal for ${name} is already ${cached}.`);
      return;
    }
    approve.mutate(name, { onSuccess: () => toast.success("Approved") });
  }

  function tryReject(name: string) {
    const sig = signals?.find((s) => s.account_name === name);
    const cached = (sig?.status ?? "pending") as SignalStatus;
    if (isTerminal(cached)) {
      toast.info(`Signal for ${name} is already ${cached}.`);
      return;
    }
    rejectMut.mutate(name, { onSuccess: () => toast.success("Rejected") });
  }

  return (
    <div className="p-6 sm:p-8 max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100">
          Signals
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Open a row for signal + playbook detail. Non-terminal rows can be
          approved or rejected.
        </p>
      </div>

      <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              type="button"
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${
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

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-zinc-950 border-b border-zinc-800">
            <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-500">
              <Th>Account</Th>
              <Th>Source</Th>
              <Th>Why now</Th>
              <Th className="text-right">Velocity</Th>
              <Th>Status</Th>
              <Th>Assigned</Th>
              <Th className="text-right pr-4 sm:pr-5">Action</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-xs text-zinc-500">
                  Loading signals…
                </td>
              </tr>
            )}
            {filtered.map((s: SignalRow) => {
              const name = s.account_name ?? "";
              const status = (s.status ?? "pending") as SignalStatus;
              const showApprove = canTransition(status, "approved");
              const showReject = canTransition(status, "rejected");
              return (
                <tr
                  key={s.id}
                  onClick={() => name && setReceiptFor({ name })}
                  className="hover:bg-zinc-800/50 cursor-pointer"
                >
                  <Td className="font-medium text-zinc-100">
                    {name || "—"}
                  </Td>
                  <Td>
                    <SourceBadge source={s.source} />
                  </Td>
                  <Td className="text-zinc-400 max-w-[280px] sm:max-w-[320px]">
                    {s.why_now ?? "—"}
                  </Td>
                  <Td className="text-right font-mono tabular-nums text-zinc-100">
                    {s.velocity_score ?? 0}
                  </Td>
                  <Td>
                    <StatusBadge status={status} />
                  </Td>
                  <Td className="text-zinc-400">
                    {s.assigned_to ?? (
                      <span className="text-zinc-600">—</span>
                    )}
                  </Td>
                  <Td className="text-right pr-4 sm:pr-5">
                    <span
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5"
                    >
                      {showApprove && name && (
                        <button
                          type="button"
                          onClick={() => tryApprove(name)}
                          disabled={
                            approve.isPending &&
                            approve.variables === name
                          }
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-emerald-400 text-zinc-950 font-medium hover:bg-emerald-300 disabled:opacity-50"
                        >
                          {approve.isPending &&
                          approve.variables === name ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Approve
                        </button>
                      )}
                      {showReject && name && (
                        <button
                          type="button"
                          onClick={() => tryReject(name)}
                          disabled={
                            rejectMut.isPending &&
                            rejectMut.variables === name
                          }
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-red-500/40 text-red-300 font-medium hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {rejectMut.isPending &&
                          rejectMut.variables === name ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          Reject
                        </button>
                      )}
                      {!showApprove && !showReject && (
                        <span className="text-xs text-zinc-500">—</span>
                      )}
                    </span>
                  </Td>
                </tr>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-xs text-zinc-500">
                  No signals for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ReceiptPanel
        account={receiptFor}
        onClose={() => setReceiptFor(null)}
      />
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

function StatusBadge({ status }: { status: SignalStatus }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
        <CheckCircle2 className="h-3 w-3 shrink-0" /> Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-300">
        <XCircle className="h-3 w-3 shrink-0" /> Rejected
      </span>
    );
  }
  if (status === "held") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
        <AlertTriangle className="h-3 w-3 shrink-0" /> Held
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded border border-zinc-600 bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
      <Clock className="h-3 w-3 shrink-0" /> Pending
    </span>
  );
}
