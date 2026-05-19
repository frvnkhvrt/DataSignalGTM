"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useInvalidateOrgGtm } from "@/hooks/use-invalidate-org";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCurrentOrg } from "@/lib/auth-context";
import { DemoLimitedAction } from "@/components/demo/demo-limited-action";
import { SignalsTable, signalsRecentQuery } from "@/features/signals";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/ui/page-header";
import { QueryError } from "@/components/ui/query-error";

export default function SignalsPage() {
  const org = useCurrentOrg();
  const { invalidateOrgGtm } = useInvalidateOrgGtm(org.id);
  const {
    data: signals = [],
    isLoading,
    isFetching,
    isError,
    refetch,
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
      invalidateOrgGtm("signals");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Backfill failed");
    },
  });

  if (isError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <QueryError
          message="Could not load signals. Check your connection and try again."
          onRetry={() => void refetch()}
          className="mx-auto max-w-lg"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Signals"
        title="Review queue"
        description="Prioritize, generate playbooks, and approve revenue signals."
        actions={
          missingPlaybooks > 0 ? (
            <DemoLimitedAction action="backfill_playbooks" surface="signals_page">
              <Button
                type="button"
                onClick={() => backfill.mutate()}
                disabled={backfill.isPending}
                variant="success"
                size="sm"
              >
                {backfill.isPending ? (
                  <Spinner size="md" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Queue missing playbooks ({missingPlaybooks})
              </Button>
            </DemoLimitedAction>
          ) : undefined
        }
      />

      <SignalsTable
        signals={signals}
        isLoading={isLoading}
        isRefetching={isFetching && !isLoading}
      />
    </div>
  );
}
