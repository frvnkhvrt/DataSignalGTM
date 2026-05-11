import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, Loader2, Copy, X } from "lucide-react";
import {
  accountsByDqQuery,
  accountsByIcpQuery,
  approveSignal,
  signalsRecentQuery,
  type AccountRow,
  type SignalRow,
} from "@/lib/gtm-queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — DataSignalGTM" },
      {
        name: "description",
        content: "Signal queue, account quality, and approval workflow.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: dqAccounts } = useQuery(accountsByDqQuery);
  const { data: hot } = useQuery(accountsByIcpQuery);
  const { data: signals } = useQuery(signalsRecentQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [engageFor, setEngageFor] = useState<AccountRow | null>(null);
  const approve = useMutation({
    mutationFn: (name: string) => approveSignal(name),
    onMutate: async (name: string) => {
      await qc.cancelQueries({ queryKey: ["signals"] });
      const prev = qc.getQueryData<SignalRow[]>(signalsRecentQuery.queryKey);
      qc.setQueryData<SignalRow[]>(signalsRecentQuery.queryKey, (old) =>
        old ? old.map((s) => (s.account_name === name ? { ...s, status: "approved" } : s)) : old,
      );
      return { prev };
    },
    onError: (_e, _n, ctx) => {
      if (ctx?.prev) qc.setQueryData(signalsRecentQuery.queryKey, ctx.prev);
      toast.error("Approve failed");
    },
    onSuccess: () => {
      toast.success("Approved");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["signals"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const health =
    dqAccounts && dqAccounts.length
      ? Math.round(
          dqAccounts.reduce((s, a) => s + a.data_quality_score, 0) /
            dqAccounts.length,
        )
      : 0;
  const avgIcp =
    dqAccounts && dqAccounts.length
      ? Math.round(
          dqAccounts.reduce((s, a) => s + a.icp_fit_score, 0) /
            dqAccounts.length,
        )
      : 0;
  const coverage =
    dqAccounts && dqAccounts.length
      ? Math.round(
          (dqAccounts.filter((a) => a.data_quality_score >= 75).length /
            dqAccounts.length) *
            100,
        )
      : 0;

  const approved = signals?.filter((s) => s.status === "approved").length ?? 0;
  const held = signals?.filter((s) => s.status === "held").length ?? 0;
  const signalCount = signals?.length ?? 0;
  const avgVelocity =
    signals && signals.length > 0
      ? Math.round(
          signals.reduce((s, x) => s + x.velocity_score, 0) / signals.length,
        )
      : null;

  const metrics = [
    { label: "Signals", value: String(signalCount) },
    { label: "Held", value: String(held) },
    { label: "Approved", value: String(approved) },
    { label: "Avg velocity", value: avgVelocity != null ? String(avgVelocity) : "—" },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-[1400px]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 lg:col-span-1">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Avg data quality (DQ)</div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-5xl sm:text-6xl font-semibold font-mono tabular-nums text-zinc-100">
              {health}
            </span>
            <span className="text-sm text-zinc-500">/ 100</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
            <SubScore label="Avg ICP" value={avgIcp} />
            <Dot />
            <SubScore label="Coverage" value={coverage} suffix="%" tone={coverage < 80 ? "warn" : undefined} />
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Coverage = share of accounts with DQ ≥ 75.
          </p>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="text-[11px] uppercase tracking-wide text-zinc-500">{m.label}</div>
              <div className="mt-2 text-xl font-semibold font-mono tabular-nums text-zinc-100">
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">Recent signals</h2>
          <span className="text-xs text-zinc-500">Newest first</span>
        </div>
        <ul className="divide-y divide-zinc-800">
          {(signals ?? []).map((s) => {
            const acct = dqAccounts?.find((a) => a.name === s.account_name);
            const dq = acct?.data_quality_score;
            const blocked = s.status === "held" && typeof dq === "number" && dq < 75;
            return (
              <li key={s.id} className="px-4 sm:px-5 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-zinc-100">{s.account_name}</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-sm text-zinc-400 truncate">{s.source ?? "—"}</span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Velocity{" "}
                      <span className="font-mono tabular-nums text-zinc-300">
                        {s.velocity_score}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusPill status={s.status} />
                    {s.status === "held" && (
                      <button
                        onClick={() => approve.mutate(s.account_name)}
                        disabled={approve.isPending && approve.variables === s.account_name}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-emerald-400 text-zinc-950 font-medium hover:bg-emerald-300 disabled:opacity-50"
                      >
                        {approve.isPending && approve.variables === s.account_name ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </button>
                    )}
                  </div>
                </div>
                {blocked && (
                  <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    <AlertTriangle className="h-3.5 w-3.5 mt-px shrink-0" />
                    <span>DQ {dq}/100 — approve blocked until account DQ ≥ 75.</span>
                  </div>
                )}
              </li>
            );
          })}
          {!signals && (
            <li className="px-5 py-6 text-xs text-zinc-500">Loading signals…</li>
          )}
        </ul>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">Highest ICP fit</h2>
          <span className="text-xs text-zinc-500">Top 3 by ICP score</span>
        </div>
        <ul className="divide-y divide-zinc-800">
          {(hot ?? []).map((a) => (
            <li key={a.id} className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="sm:w-52 min-w-0 flex-1">
                <div className="text-sm font-semibold text-zinc-100 truncate">{a.name}</div>
                <div className="text-xs text-zinc-500 truncate">
                  {a.industry ?? "—"}
                  {a.employee_count != null ? ` · ${a.employee_count.toLocaleString()} employees` : ""}
                </div>
              </div>
              <div className="flex sm:flex-1 items-center gap-3 min-w-0">
                <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden min-w-[4rem]">
                  <div
                    className="h-full bg-zinc-400"
                    style={{ width: `${Math.min(100, a.icp_fit_score)}%` }}
                  />
                </div>
                <span className="text-xs font-mono tabular-nums text-zinc-300 w-8 text-right shrink-0">
                  {a.icp_fit_score}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/accounts" })}
                  className="text-xs px-3 py-1.5 rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Accounts
                </button>
                <button
                  type="button"
                  onClick={() => setEngageFor(a)}
                  className="text-xs px-3 py-1.5 rounded-md bg-emerald-400 text-zinc-950 font-medium hover:bg-emerald-300"
                >
                  Copy intro
                </button>
              </div>
            </li>
          ))}
          {!hot && (
            <li className="px-5 py-6 text-xs text-zinc-500">Loading accounts…</li>
          )}
        </ul>
      </section>

      <EngageModal account={engageFor} onClose={() => setEngageFor(null)} />
    </div>
  );
}

function Dot() {
  return <span className="text-zinc-600">·</span>;
}

function SubScore({
  label,
  value,
  suffix = "",
  tone,
}: {
  label: string;
  value: number;
  suffix?: string;
  tone?: "warn";
}) {
  const color = tone === "warn" ? "text-amber-400" : "text-zinc-200";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-mono tabular-nums ${color}`}>
        {value}
        {suffix}
      </span>
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "approved") {
    return (
      <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
        Approved
      </span>
    );
  }
  if (s === "held") {
    return (
      <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
        Held
      </span>
    );
  }
  if (s === "rejected") {
    return (
      <span className="rounded border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-300">
        Rejected
      </span>
    );
  }
  return (
    <span className="rounded border border-zinc-600 bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
      {status}
    </span>
  );
}

function EngageModal({
  account,
  onClose,
}: {
  account: AccountRow | null;
  onClose: () => void;
}) {
  if (!account) return null;
  const emp =
    account.employee_count != null
      ? `${account.employee_count.toLocaleString()} employees`
      : "size unknown";
  const message = `Hi ${account.name},

Opening note for your CRM (from DataSignalGTM):
- Industry: ${account.industry ?? "n/a"}
- ${emp}
- ICP fit score in workspace: ${account.icp_fit_score}/100

We can align on what triggered this account if you want to continue the thread.

—`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="engage-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <div id="engage-title" className="text-sm font-semibold text-zinc-100">
              {account.name}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">Editable after paste</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">
          <div className="text-xs text-zinc-500 mb-2">Message draft</div>
          <textarea
            readOnly
            value={message}
            className="w-full h-52 resize-y rounded-md border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-200 leading-relaxed focus:outline-none focus:ring-1 focus:ring-zinc-600"
          />
        </div>
        <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Close
          </button>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-emerald-400 text-zinc-950 font-medium hover:bg-emerald-300"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
