import type { SignalStatus } from "@/types/signal";

const STATUS_STYLES: Record<SignalStatus, string> = {
  approved:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  held: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  pending: "border-zinc-600 bg-zinc-800/80 text-zinc-300",
  rejected: "border-red-500/40 bg-red-500/10 text-red-300",
};

const STATUS_LABELS: Record<SignalStatus, string> = {
  approved: "Approved",
  held: "Held",
  pending: "Pending",
  rejected: "Rejected",
};

export function StatusPill({ status }: { status: SignalStatus }) {
  return (
    <span
      className={`rounded border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
