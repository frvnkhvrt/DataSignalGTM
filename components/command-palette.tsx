"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Search, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useCurrentOrg } from "@/lib/auth-context";
import { useFlags } from "@/lib/use-flags";
import {
  accountsByDqQuery,
  approveSignal,
  generatePlaybookForSignal,
  rejectSignal,
  signalsRecentQuery,
} from "@/lib/gtm-queries";
import { canTransition } from "@/types/signal";
import type { SignalStatus } from "@/types/signal";

export function CommandPalette() {
  const router = useRouter();
  const org = useCurrentOrg();
  const flags = useFlags();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: accounts = [] } = useQuery(accountsByDqQuery(org.id));
  const { data: signals = [] } = useQuery(signalsRecentQuery(org.id));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["org", org.id, "signals"] });
    qc.invalidateQueries({ queryKey: ["org", org.id, "accounts"] });
  };

  const generate = useMutation({
    mutationFn: (signalId: string) => generatePlaybookForSignal(org.id, signalId),
    onSuccess: () => {
      invalidate();
      toast.success("Playbook job queued");
      setOpen(false);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Generation failed"),
  });

  const transition = useMutation({
    mutationFn: ({
      action,
      accountName,
    }: {
      action: "approve" | "reject";
      accountName: string;
    }) =>
      action === "approve"
        ? approveSignal(org.id, accountName)
        : rejectSignal(org.id, accountName),
    onSuccess: (_data, variables) => {
      invalidate();
      toast.success(
        variables.action === "approve" ? "Signal approved" : "Signal rejected"
      );
      setOpen(false);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Action failed"),
  });

  const signalsByAccount = useMemo(() => {
    const map = new Map<string, (typeof signals)[number]>();
    for (const signal of signals) {
      if (signal.account_name) map.set(signal.account_name, signal);
    }
    return map;
  }, [signals]);

  if (!flags.enable_command_palette) return null;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-3 pt-20"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4">
          <Search className="h-4 w-4 text-zinc-500" />
          <Command.Input
            placeholder="Search accounts or run actions..."
            className="h-12 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          />
          <kbd className="rounded border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
            Esc
          </kbd>
        </div>
        <Command.List className="max-h-[420px] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-8 text-center text-sm text-zinc-500">
            No results found.
          </Command.Empty>

          <Command.Group heading="Navigate" className="text-xs text-zinc-500">
            <Command.Item
              value="go to signals"
              onSelect={() => {
                router.push("/signals");
                setOpen(false);
              }}
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-zinc-200 aria-selected:bg-zinc-900"
            >
              Go to Signals
            </Command.Item>
            <Command.Item
              value="go to accounts"
              onSelect={() => {
                router.push("/accounts");
                setOpen(false);
              }}
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-zinc-200 aria-selected:bg-zinc-900"
            >
              Go to Accounts
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Accounts" className="mt-2 text-xs text-zinc-500">
            {accounts.map((account) => {
              const signal = signalsByAccount.get(account.name);
              const canGenerate =
                signal &&
                !signal.playbook &&
                signal.status !== "rejected" &&
                signal.playbook_status !== "queued" &&
                signal.playbook_status !== "generating";

              return (
                <Command.Item
                  key={account.id}
                  value={`${account.name} ${account.domain ?? ""} generate playbook`}
                  onSelect={() => {
                    if (canGenerate) {
                      generate.mutate(signal.id);
                    } else {
                      router.push("/accounts");
                      setOpen(false);
                    }
                  }}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-zinc-200 aria-selected:bg-zinc-900"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{account.name}</span>
                    <span className="block truncate text-xs text-zinc-500">
                      {account.domain ?? account.industry ?? "Account"}
                    </span>
                  </span>
                  {canGenerate && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate
                    </span>
                  )}
                </Command.Item>
              );
            })}
          </Command.Group>

          <Command.Group heading="Signals" className="mt-2 text-xs text-zinc-500">
            {signals.map((signal) => {
              const name = signal.account_name ?? "";
              const status = (signal.status ?? "pending") as SignalStatus;
              const canApprove = name && canTransition(status, "approved");
              const canReject = name && canTransition(status, "rejected");

              return (
                <div key={signal.id}>
                  {canApprove && (
                    <Command.Item
                      value={`approve ${name}`}
                      onSelect={() =>
                        transition.mutate({
                          action: "approve",
                          accountName: name,
                        })
                      }
                      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-200 aria-selected:bg-zinc-900"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Approve {name}
                    </Command.Item>
                  )}
                  {canReject && (
                    <Command.Item
                      value={`reject ${name}`}
                      onSelect={() =>
                        transition.mutate({
                          action: "reject",
                          accountName: name,
                        })
                      }
                      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-200 aria-selected:bg-zinc-900"
                    >
                      <XCircle className="h-3.5 w-3.5 text-red-300" />
                      Reject {name}
                    </Command.Item>
                  )}
                </div>
              );
            })}
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
