import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, Mail, Linkedin, Phone, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { approveSignal, playbookForAccountQuery, type PlaybookStep } from "@/lib/gtm-queries";

type Account = { name: string; dq?: number; icp?: number; industry?: string | null };

function channelIcon(channel: string) {
  const c = channel.toLowerCase();
  if (c.includes("linkedin")) return <Linkedin className="h-3.5 w-3.5 shrink-0" />;
  if (c.includes("email")) return <Mail className="h-3.5 w-3.5 shrink-0" />;
  if (c.includes("phone")) return <Phone className="h-3.5 w-3.5 shrink-0" />;
  return <MessageSquare className="h-3.5 w-3.5 shrink-0" />;
}

export function ReceiptPanel({
  account,
  onClose,
}: {
  account: Account | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    ...playbookForAccountQuery(account?.name ?? ""),
    enabled: !!account,
  });

  const approve = useMutation({
    mutationFn: () => approveSignal(account!.name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["signals"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Approved");
    },
    onError: () => {
      toast.error("Approve failed");
    },
  });

  const pb = data?.playbook ?? null;
  const isApproved = data?.status === "approved";

  return (
    <Sheet open={!!account} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-zinc-950 border-l border-zinc-800 text-zinc-100 p-0 overflow-y-auto"
      >
        <SheetHeader className="px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            Playbook
          </div>
          <SheetTitle className="text-zinc-100 text-base">
            {account?.name ?? ""}
          </SheetTitle>
        </SheetHeader>

        {(account?.dq != null || account?.icp != null || account?.industry) && (
          <div className="px-6 py-4 border-b border-zinc-800 grid grid-cols-3 gap-3">
            {account?.industry && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Industry</div>
                <div className="mt-1 text-sm text-zinc-100 truncate">{account.industry}</div>
              </div>
            )}
            {account?.dq != null && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">DQ</div>
                <div className="mt-1 text-sm font-mono tabular-nums font-semibold text-zinc-100">
                  {account.dq}
                </div>
              </div>
            )}
            {account?.icp != null && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">ICP fit</div>
                <div className="mt-1 text-sm font-mono tabular-nums font-semibold text-zinc-100">
                  {account.icp}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="px-6 py-5 space-y-3 border-b border-zinc-800">
          <Field label="Source" value={data?.source ?? "—"} />
          <Field label="Why now" value={data?.why_now ?? "—"} />
          <Field
            label="Velocity"
            valueNode={
              <span className="font-mono tabular-nums text-zinc-100">
                {data?.velocity_score ?? "—"}
              </span>
            }
          />
          <Field label="Assigned to" value={data?.assigned_to ?? "—"} />
        </div>

        <div className="px-6 py-5 space-y-4 border-b border-zinc-800">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
              Loading playbook…
            </div>
          )}

          {!isLoading && !pb && (
            <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-3 text-xs text-zinc-400">
              No playbook on this signal yet. Approve the signal (or run generation upstream) to attach
              steps.
            </div>
          )}

          {pb && (
            <>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Target role</div>
                <p className="text-sm text-zinc-100">{pb.role_target}</p>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Rationale</div>
                <p className="text-sm text-zinc-300 leading-relaxed">{pb.rationale}</p>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Channels</div>
                <div className="flex flex-wrap gap-1.5">
                  {pb.channels.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300"
                    >
                      {channelIcon(c)} {c}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-2">Sequence</div>
                <div className="space-y-2">
                  {pb.steps.map((s: PlaybookStep, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-zinc-800 bg-zinc-900 p-3 flex gap-3"
                    >
                      <div className="flex-shrink-0 w-10 flex flex-col items-center justify-center rounded border border-zinc-700 bg-zinc-950 py-1">
                        <div className="text-[9px] uppercase tracking-wide text-zinc-500">Day</div>
                        <div className="text-sm font-mono tabular-nums font-semibold text-zinc-100">
                          {s.day}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-0.5">
                          {channelIcon(s.channel)}
                          <span className="font-medium text-zinc-300">{s.channel}</span>
                        </div>
                        <div className="text-sm text-zinc-100 font-medium">{s.action}</div>
                        <div className="text-xs text-zinc-500 mt-1">
                          <span className="text-zinc-600">Hint: </span>
                          {s.message_hint}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4">
          <button
            type="button"
            disabled={isApproved || approve.isPending}
            onClick={() => approve.mutate()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-emerald-400 text-zinc-950 font-medium py-2.5 text-sm hover:bg-emerald-300 disabled:opacity-50"
          >
            {approve.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {isApproved ? "Approved" : "Approve signal"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  value,
  valueNode,
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-zinc-500 min-w-[88px] pt-0.5">{label}</span>
      <span className="text-sm text-zinc-100 text-right flex-1 break-words">{valueNode ?? value}</span>
    </div>
  );
}
