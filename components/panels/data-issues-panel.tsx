"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Database } from "lucide-react";
import type { AccountRow } from "@/lib/gtm-queries";
import { dqStatusLabel, dqTone } from "@/lib/gtm-queries";

type FieldRow = { label: string; present: boolean; detail: string };

function fieldRows(account: AccountRow): FieldRow[] {
  return [
    {
      label: "Domain",
      present: Boolean(account.domain?.trim()),
      detail: account.domain?.trim() || "Missing",
    },
    {
      label: "Industry",
      present: Boolean(account.industry?.trim()),
      detail: account.industry?.trim() || "Missing",
    },
    {
      label: "Employee count",
      present: account.employee_count != null && account.employee_count > 0,
      detail:
        account.employee_count != null && account.employee_count > 0
          ? String(account.employee_count)
          : "Missing or zero",
    },
  ];
}

export function DataIssuesPanel({
  account,
  onClose,
}: {
  account: AccountRow | null;
  onClose: () => void;
}) {
  const tone = account ? dqTone(account.data_quality_score) : "good";
  const label = account ? dqStatusLabel(account.data_quality_score) : "HEALTHY";
  const scoreColor =
    tone === "good"
      ? "text-emerald-400"
      : tone === "warn"
        ? "text-amber-400"
        : "text-red-400";
  const rows = account ? fieldRows(account) : [];

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
          <p className="mt-3 text-xs text-zinc-500">
            Playbook opens at DQ &ge; 90. Held outreach band is typically DQ
            75–89. Update source records, then refresh this page after data sync.
          </p>
        </div>

        <div className="px-6 py-4 space-y-2">
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
            Fields
          </div>
          {rows.map((row) => (
            <div
              key={row.label}
              className={`rounded-md border px-3 py-2.5 text-sm ${
                row.present
                  ? "border-zinc-800 bg-zinc-900"
                  : "border-amber-500/35 bg-amber-500/5"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-zinc-200">{row.label}</span>
                <span
                  className={`text-[11px] font-medium uppercase ${row.present ? "text-zinc-500" : "text-amber-300"}`}
                >
                  {row.present ? "Present" : "Gap"}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-400 break-all">
                {row.detail}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
