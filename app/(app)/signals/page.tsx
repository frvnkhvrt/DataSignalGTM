"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCurrentOrg } from "@/lib/auth-context";
import { signalsRecentQuery } from "@/lib/gtm-queries";
import { SignalsTable } from "@/components/tables/signals-table";

export default function SignalsPage() {
  const org = useCurrentOrg();
  const qc = useQueryClient();
  const { data: signals = [], isLoading } = useQuery(signalsRecentQuery(org.id));

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
          <h1 className="text-xl font-semibold text-zinc-100 sm:text-2xl">
            Signals
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Prioritize, generate playbooks, and approve revenue signals.
          </p>
        </div>
        {missingPlaybooks > 0 && (
          <button
            type="button"
            onClick={() => backfill.mutate()}
            disabled={backfill.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-500/40 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
          >
            {backfill.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Queue missing playbooks ({missingPlaybooks})
          </button>
        )}
      </div>

      <SignalsTable signals={signals} isLoading={isLoading} />
    </div>
  );
}
