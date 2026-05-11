import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Wrench, AlertTriangle } from "lucide-react";
import { DataIssuesPanel } from "@/components/panels/DataIssuesPanel";
import { ReceiptPanel } from "@/components/panels/ReceiptPanel";
import {
  accountsByDqQuery,
  dqStatusLabel,
  dqTone,
  type AccountRow,
  type Tone,
} from "@/lib/gtm-queries";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts — DataSignalGTM" },
      { name: "description", content: "Accounts sorted by data quality (DQ)." },
    ],
  }),
  component: AccountsPage,
});

type ReceiptTarget = { name: string; dq: number; icp?: number; industry?: string | null };

function AccountsPage() {
  const { data: accounts, isLoading } = useQuery(accountsByDqQuery);
  const [gapsFor, setGapsFor] = useState<AccountRow | null>(null);
  const [receiptFor, setReceiptFor] = useState<ReceiptTarget | null>(null);

  return (
    <div className="p-6 sm:p-8 max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100">Accounts</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Sorted by DQ (highest first). Playbook opens when DQ ≥ 90.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-zinc-950 border-b border-zinc-800">
            <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-500">
              <Th className="w-12">#</Th>
              <Th>Account</Th>
              <Th>Industry</Th>
              <Th className="text-right">DQ</Th>
              <Th className="text-right">ICP</Th>
              <Th>Status</Th>
              <Th className="text-right pr-4 sm:pr-5">Action</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-xs text-zinc-500">
                  Loading accounts…
                </td>
              </tr>
            )}
            {!isLoading && (accounts ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-xs text-zinc-500">
                  No accounts in workspace.
                </td>
              </tr>
            )}
            {(accounts ?? []).map((a, i) => {
              const tone = dqTone(a.data_quality_score);
              const status = dqStatusLabel(a.data_quality_score);
              const rowBg =
                tone === "warn"
                  ? "bg-amber-500/[0.06]"
                  : tone === "bad"
                    ? "bg-red-500/[0.06]"
                    : "";
              const dqColor =
                tone === "good"
                  ? "text-emerald-400"
                  : tone === "warn"
                    ? "text-amber-400"
                    : "text-red-400";
              const isHealthy = a.data_quality_score >= 90;
              return (
                <tr key={a.id} className={`${rowBg} hover:bg-zinc-800/40`}>
                  <Td className="font-mono tabular-nums text-zinc-500">{i + 1}</Td>
                  <Td>
                    <div className="font-medium text-zinc-100">{a.name}</div>
                    {a.employee_count != null && (
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {a.employee_count.toLocaleString()} employees
                      </div>
                    )}
                  </Td>
                  <Td className="text-zinc-400">{a.industry ?? "—"}</Td>
                  <Td className={`text-right font-mono tabular-nums font-medium ${dqColor}`}>
                    {a.data_quality_score}
                  </Td>
                  <Td className="text-right font-mono tabular-nums text-zinc-300">{a.icp_fit_score}</Td>
                  <Td>
                    <StatusChip tone={tone} label={status} />
                  </Td>
                  <Td className="text-right pr-4 sm:pr-5">
                    {isHealthy ? (
                      <button
                        type="button"
                        onClick={() =>
                          setReceiptFor({
                            name: a.name,
                            dq: a.data_quality_score,
                            icp: a.icp_fit_score,
                            industry: a.industry,
                          })
                        }
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-emerald-400 text-zinc-950 font-medium hover:bg-emerald-300"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Playbook
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setGapsFor(a)}
                        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium border ${
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

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 sm:px-4 py-3 font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
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
