import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Loader2, AlertTriangle, XCircle } from "lucide-react";
import { approveSignal, signalsRecentQuery, type SignalRow } from "@/lib/gtm-queries";
import { SourceBadge } from "@/components/SourceBadge";
import { ReceiptPanel } from "@/components/panels/ReceiptPanel";

export const Route = createFileRoute("/signals")({
  head: () => ({
    meta: [
      { title: "Signals — DataSignalGTM" },
      { name: "description", content: "Signal list, filters, and approval." },
    ],
  }),
  component: SignalsPage,
});

type Filter = "all" | "held" | "approved";

function SignalsPage() {
  const { data: signals, isLoading } = useQuery(signalsRecentQuery);
  const [receiptFor, setReceiptFor] = useState<{ name: string } | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = (signals ?? []).filter((s) =>
    filter === "all" ? true : s.status === filter,
  );
  const counts = {
    all: signals?.length ?? 0,
    held: signals?.filter((s) => s.status === "held").length ?? 0,
    approved: signals?.filter((s) => s.status === "approved").length ?? 0,
  };
  const qc = useQueryClient();

  const approve = useMutation({
    mutationFn: (name: string) => approveSignal(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["signals"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: () => toast.error("Approve failed"),
  });

  return (
    <div className="p-6 sm:p-8 max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100">Signals</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Open a row for signal + playbook detail. Held rows can be approved here.
        </p>
      </div>

      <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {(["all", "held", "approved"] as Filter[]).map((f) => {
          const active = filter === f;
          return (
            <button
              type="button"
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${
                active ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {f}{" "}
              <span className={`font-mono tabular-nums ${active ? "text-zinc-600" : "text-zinc-600"}`}>
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
            {filtered.map((s: SignalRow) => (
              <tr
                key={s.id}
                onClick={() => setReceiptFor({ name: s.account_name })}
                className="hover:bg-zinc-800/50 cursor-pointer"
              >
                <Td className="font-medium text-zinc-100">{s.account_name}</Td>
                <Td>
                  <SourceBadge source={s.source} />
                </Td>
                <Td className="text-zinc-400 max-w-[280px] sm:max-w-[320px]">{s.why_now ?? "—"}</Td>
                <Td className="text-right font-mono tabular-nums text-zinc-100">{s.velocity_score}</Td>
                <Td>
                  <StatusBadge status={s.status} />
                </Td>
                <Td className="text-zinc-400">{s.assigned_to ?? <span className="text-zinc-600">—</span>}</Td>
                <Td className="text-right pr-4 sm:pr-5">
                  <span onClick={(e) => e.stopPropagation()} className="inline-block">
                    {s.status === "held" ? (
                      <button
                        type="button"
                        onClick={() => {
                          approve.mutate(s.account_name, {
                            onSuccess: () => toast.success("Approved"),
                          });
                        }}
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
                    ) : s.status === "approved" ? (
                      <span className="text-xs text-zinc-500">—</span>
                    ) : (
                      <span className="text-xs text-zinc-500">—</span>
                    )}
                  </span>
                </Td>
              </tr>
            ))}
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
      <ReceiptPanel account={receiptFor} onClose={() => setReceiptFor(null)} />
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 sm:px-4 py-3 font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 sm:px-4 py-3 ${className}`}>{children}</td>;
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
        <CheckCircle2 className="h-3 w-3 shrink-0" /> Approved
      </span>
    );
  }
  if (s === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-300">
        <XCircle className="h-3 w-3 shrink-0" /> Rejected
      </span>
    );
  }
  if (s === "held") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
        <AlertTriangle className="h-3 w-3 shrink-0" /> Held
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded border border-zinc-600 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
      {status}
    </span>
  );
}
