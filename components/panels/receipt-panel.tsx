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
import { Button } from "@/components/ui/button";
import type { SignalStatus } from "@/types/signal";
import { isTerminal, canTransition } from "@/types/signal";
import { motion, AnimatePresence } from "motion/react";

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
        className="w-full sm:max-w-lg bg-card border-l border-border text-card-foreground p-0 overflow-y-auto"
      >
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Playbook
          </div>
          <SheetTitle className="text-foreground text-base">
            {account?.name ?? ""}
          </SheetTitle>
        </SheetHeader>

        {(account?.dq != null ||
          account?.icp != null ||
          account?.industry) && (
          <div className="px-6 py-4 border-b border-border grid grid-cols-3 gap-3">
            {account?.industry && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Industry
                </div>
                <div className="mt-1 text-sm text-foreground truncate">
                  {account.industry}
                </div>
              </div>
            )}
            {account?.dq != null && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  DQ
                </div>
                <div className="mt-1 text-sm font-mono tabular-nums font-semibold text-foreground">
                  {account.dq}
                </div>
              </div>
            )}
            {account?.icp != null && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  ICP fit
                </div>
                <div className="mt-1 text-sm font-mono tabular-nums font-semibold text-foreground">
                  {account.icp}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="px-6 py-5 space-y-3 border-b border-border">
          <Field label="Source" value={data?.source ?? "—"} />
          <Field label="Why now" value={data?.why_now ?? "—"} />
          <Field
            label="Velocity"
            valueNode={
              <span className="font-mono tabular-nums text-foreground">
                {data?.velocity_score ?? "—"}
              </span>
            }
          />
          <Field label="Assigned to" value={data?.assigned_to ?? "—"} />
        </div>

        <div className="px-6 py-5 space-y-4 border-b border-border">
          {/* min-h prevents the container from collapsing to the loading-spinner
              height mid-crossfade, which would cause a jarring layout jump */}
          <div className="min-h-[2.5rem]">
          <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="pb-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              Loading playbook…
            </motion.div>
          )}

          {!isLoading && !pb && (
            <motion.div
              key="pb-empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3"
            >
              <div className="rounded-md border border-border bg-background/60 px-3 py-3 text-xs text-muted-foreground">
                {isGenerating
                  ? "Generating playbook in the background..."
                  : playbookStatus === "failed"
                    ? (data?.playbook_error ?? "Playbook generation failed.")
                    : "No playbook on this signal yet."}
              </div>
              {data?.id && (
                <DemoLimitedAction action="generate_playbook" surface="receipt_panel">
                  <Button
                    type="button"
                    variant="success"
                    disabled={generateMut.isPending || isGenerating}
                    onClick={() => generateMut.mutate(data.id)}
                    className="w-full"
                  >
                    {generateMut.isPending || isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {isGenerating ? "Generating..." : "Generate playbook"}
                  </Button>
                </DemoLimitedAction>
              )}
            </motion.div>
          )}

          {pb && (
            <motion.div
              key="pb-content"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  Target role
                </div>
                <p className="text-sm text-foreground">{pb.role_target}</p>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  Rationale
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {pb.rationale}
                </p>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  Channels
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pb.channels.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1.5 rounded border border-border bg-background/60 px-2 py-1 text-[11px] text-foreground"
                    >
                      {channelIcon(c)} {c}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
                  Sequence
                </div>
                <div className="space-y-2">
                  {pb.steps.map((s: PlaybookStep, i: number) => (
                    <div
                      key={i}
                      className="rounded-md border border-border bg-background/60 p-3 flex gap-3"
                    >
                      <div className="flex-shrink-0 w-10 flex flex-col items-center justify-center rounded border border-border bg-background py-1">
                        <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
                          Day
                        </div>
                        <div className="text-sm font-mono tabular-nums font-semibold text-foreground">
                          {s.day}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
                          {channelIcon(s.channel)}
                          <span className="font-medium text-foreground">
                            {s.channel}
                          </span>
                        </div>
                        <div className="text-sm text-foreground font-medium">
                          {s.action}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="text-muted-foreground/60">Hint: </span>
                          {s.message_hint}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
          </div>
        </div>

        {!terminal && (
          <div className="flex gap-2 px-6 py-4">
            {canApprove && (
              <DemoLimitedAction
                action="approve_signal"
                surface="receipt_panel"
                wrapperClassName="flex-1"
              >
                <Button
                  type="button"
                  variant="default"
                  disabled={approve.isPending}
                  onClick={() => tryApprove()}
                  className="w-full"
                >
                  {approve.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve
                </Button>
              </DemoLimitedAction>
            )}
            {canReject && (
              <DemoLimitedAction
                action="reject_signal"
                surface="receipt_panel"
                wrapperClassName="flex-1"
              >
                <Button
                  type="button"
                  variant="destructive"
                  disabled={reject.isPending}
                  onClick={() => tryReject()}
                  className="w-full"
                >
                  {reject.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Reject
                </Button>
              </DemoLimitedAction>
            )}
          </div>
        )}

        {terminal && (
          <div className="px-6 py-4 text-center">
            <span className="ds-eyebrow capitalize text-muted-foreground">
              {status}
            </span>
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
      <span className="text-xs text-muted-foreground min-w-[88px] pt-0.5">
        {label}
      </span>
      <span className="text-sm text-foreground text-right flex-1 break-words">
        {valueNode ?? value}
      </span>
    </div>
  );
}
