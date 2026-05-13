"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCurrentOrg } from "@/lib/auth-context";
import { signalsRecentQuery } from "@/lib/gtm-queries";
import { DemoLimitedAction } from "@/components/demo/demo-limited-action";
import { SignalsTable } from "@/components/tables/signals-table";
import { Button } from "@/components/ui/button";

export default function SignalsPage() {
  const org = useCurrentOrg();
  const qc = useQueryClient();
  const {
    data: signals = [],
    isLoading,
    isFetching,
  } = useQuery(signalsRecentQuery(org.id));

  const missingPlaybooks = signals.filter(
    (signal) =>
      !signal.playbook &&
      signal.status !== "rejected" &&
      signal.playbook_status !== "queued" &&
      signal.playbook_status !== "generating"
  ).length;

  const backfill = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/backfill-playbooks", { method: "POST" });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Backfill failed");
      }
      return body as { queued: number };
    },
    onSuccess: ({ queued }) => {
      toast.success(
        queued > 0
          ? `Queued ${queued} playbook job(s)`
          : "No playbooks needed backfill"
      );
      qc.invalidateQueries({ queryKey: ["org", org.id, "signals"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Backfill failed");
    },
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="ds-heading text-2xl font-semibold text-foreground sm:text-3xl">
            Signals
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Prioritize, generate playbooks, and approve revenue signals.
          </p>
        </div>
        {missingPlaybooks > 0 && (
          <DemoLimitedAction action="backfill_playbooks" surface="signals_page">
            <Button
              type="button"
              onClick={() => backfill.mutate()}
              disabled={backfill.isPending}
              variant="success"
              size="sm"
            >
              {backfill.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Queue missing playbooks ({missingPlaybooks})
            </Button>
          </DemoLimitedAction>
        )}
      </div>

      <SignalsTable
        signals={signals}
        isLoading={isLoading}
        isRefetching={isFetching && !isLoading}
      />
    </div>
  );
}
