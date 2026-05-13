"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShieldCheck,
  Mail,
  Linkedin,
  Phone,
  MessageSquare,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import {
  approveSignal,
  rejectSignal,
  isTransitionError,
  isApproveRequiresPlaybookError,
  playbookForAccountQuery,
  generatePlaybookForSignal,
  type PlaybookStep,
} from "@/lib/gtm-queries";
import { useCurrentOrg } from "@/lib/auth-context";
import { DemoLimitedAction } from "@/components/demo/demo-limited-action";
import type { SignalStatus } from "@/types/signal";
import { isTerminal, canTransition } from "@/types/signal";

type Account = {
  name: string;
  dq?: number;
  icp?: number;
  industry?: string | null;
};

function channelIcon(channel: string) {
  const c = channel.toLowerCase();
  if (c.includes("linkedin"))
    return <Linkedin className="h-3.5 w-3.5 shrink-0" />;
  if (c.includes("email"))
    return <Mail className="h-3.5 w-3.5 shrink-0" />;
  if (c.includes("phone"))
    return <Phone className="h-3.5 w-3.5 shrink-0" />;
  return <MessageSquare className="h-3.5 w-3.5 shrink-0" />;
}

export function ReceiptPanel({
  account,
  onClose,
}: {
  account: Account | null;
  onClose: () => void;
}) {
  const org = useCurrentOrg();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    ...playbookForAccountQuery(org.id, account?.name ?? ""),
    enabled: !!account,
  });

  const approve = useMutation({
    mutationFn: () => approveSignal(org.id, account!.name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org", org.id, "signals"] });
      qc.invalidateQueries({ queryKey: ["org", org.id, "accounts"] });
      toast.success("Signal approved", {
        description: account?.name,
      });
    },
    onError: (e) => {
      if (isApproveRequiresPlaybookError(e)) {
        toast.error(e.message);
      } else if (isTransitionError(e)) {
        toast.info(e.message);
      } else {
        toast.error(e instanceof Error ? e.message : "Approve failed");
      }
    },
  });

  const reject = useMutation({
    mutationFn: () => rejectSignal(org.id, account!.name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org", org.id, "signals"] });
      qc.invalidateQueries({ queryKey: ["org", org.id, "accounts"] });
      toast.success("Signal rejected", {
        description: account?.name,
      });
    },
    onError: (e) =>
      isTransitionError(e)
        ? toast.info(e.message)
        : toast.error(e instanceof Error ? e.message : "Reject failed"),
  });

  const generateMut = useMutation({
    mutationFn: (signalId: string) => generatePlaybookForSignal(org.id, signalId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org", org.id, "signals"] });
      toast.success("Playbook generation queued", {
        description: "The playbook panel will update when it is ready.",
      });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Generation failed"),
  });

  const pb = data?.playbook ?? null;
  const status = ((data?.status as string) ?? "pending") as SignalStatus;
  const playbookStatus = data?.playbook_status ?? "idle";
  const isGenerating =
    playbookStatus === "queued" || playbookStatus === "generating";
  const terminal = isTerminal(status);
  const canApprove = canTransition(status, "approved");
  const canReject = canTransition(status, "rejected");

  function tryApprove() {
    if (isTerminal(status)) {
      toast.info(`Signal for ${account?.name} is already ${status}.`);
      return;
    }
    approve.mutate();
  }

  function tryReject() {
    if (isTerminal(status)) {
      toast.info(`Signal for ${account?.name} is already ${status}.`);
      return;
    }
    reject.mutate();
  }

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

        {(account?.dq != null ||
          account?.icp != null ||
          account?.industry) && (
          <div className="px-6 py-4 border-b border-zinc-800 grid grid-cols-3 gap-3">
            {account?.industry && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                  Industry
                </div>
                <div className="mt-1 text-sm text-zinc-100 truncate">
                  {account.industry}
                </div>
              </div>
            )}
            {account?.dq != null && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                  DQ
                </div>
                <div className="mt-1 text-sm font-mono tabular-nums font-semibold text-zinc-100">
                  {account.dq}
                </div>
              </div>
            )}
            {account?.icp != null && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                  ICP fit
                </div>
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
            <div className="space-y-3">
              <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-3 text-xs text-zinc-400">
                {isGenerating
                  ? "Generating playbook in the background..."
                  : playbookStatus === "failed"
                    ? (data?.playbook_error ?? "Playbook generation failed.")
                    : "No playbook on this signal yet."}
              </div>
              {data?.id && (
                <DemoLimitedAction action="generate_playbook" surface="receipt_panel">
                  <button
                    type="button"
                    disabled={generateMut.isPending || isGenerating}
                    onClick={() => generateMut.mutate(data.id)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-emerald-500/40 text-emerald-300 font-medium py-2.5 text-sm hover:bg-emerald-500/10 disabled:opacity-50"
                  >
                    {generateMut.isPending || isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {isGenerating ? "Generating..." : "Generate playbook"}
                  </button>
                </DemoLimitedAction>
              )}
            </div>
          )}

          {pb && (
            <>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">
                  Target role
                </div>
                <p className="text-sm text-zinc-100">{pb.role_target}</p>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">
                  Rationale
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {pb.rationale}
                </p>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">
                  Channels
                </div>
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
                <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-2">
                  Sequence
                </div>
                <div className="space-y-2">
                  {pb.steps.map((s: PlaybookStep, i: number) => (
                    <div
                      key={i}
                      className="rounded-md border border-zinc-800 bg-zinc-900 p-3 flex gap-3"
                    >
                      <div className="flex-shrink-0 w-10 flex flex-col items-center justify-center rounded border border-zinc-700 bg-zinc-950 py-1">
                        <div className="text-[9px] uppercase tracking-wide text-zinc-500">
                          Day
                        </div>
                        <div className="text-sm font-mono tabular-nums font-semibold text-zinc-100">
                          {s.day}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-0.5">
                          {channelIcon(s.channel)}
                          <span className="font-medium text-zinc-300">
                            {s.channel}
                          </span>
                        </div>
                        <div className="text-sm text-zinc-100 font-medium">
                          {s.action}
                        </div>
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

        {!terminal && (
          <div className="px-6 py-4 flex gap-2">
            {canApprove && (
              <DemoLimitedAction
                action="approve_signal"
                surface="receipt_panel"
                wrapperClassName="flex-1"
              >
                <button
                  type="button"
                  disabled={approve.isPending}
                  onClick={() => tryApprove()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-emerald-400 text-zinc-950 font-medium py-2.5 text-sm hover:bg-emerald-300 disabled:opacity-50"
                >
                  {approve.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve
                </button>
              </DemoLimitedAction>
            )}
            {canReject && (
              <DemoLimitedAction
                action="reject_signal"
                surface="receipt_panel"
                wrapperClassName="flex-1"
              >
                <button
                  type="button"
                  disabled={reject.isPending}
                  onClick={() => tryReject()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-red-500/40 text-red-300 font-medium py-2.5 text-sm hover:bg-red-500/10 disabled:opacity-50"
                >
                  {reject.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Reject
                </button>
              </DemoLimitedAction>
            )}
          </div>
        )}

        {terminal && (
          <div className="px-6 py-4">
            <div className="text-xs text-zinc-500 text-center capitalize">
              {status}
            </div>
          </div>
        )}
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
      <span className="text-xs text-zinc-500 min-w-[88px] pt-0.5">
        {label}
      </span>
      <span className="text-sm text-zinc-100 text-right flex-1 break-words">
        {valueNode ?? value}
      </span>
    </div>
  );
}
