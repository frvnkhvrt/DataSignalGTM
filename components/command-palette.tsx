"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Radio,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
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
import { useDemoLimitation } from "@/components/demo/demo-limited-action";
import { canTransition } from "@/types/signal";
import type { SignalStatus } from "@/types/signal";
import { AnimatedDialog } from "@/components/ui/animated-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

const RECENT_KEY = "datasignalgtm.commandPalette.recent";
const NAV_ITEMS = [
  { label: "Go to Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Go to Signals", href: "/signals", icon: Radio },
  { label: "Go to Accounts", href: "/accounts", icon: Building2 },
] as const;

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return text;

  const index = text.toLowerCase().indexOf(q.toLowerCase());
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-primary/20 px-0.5 text-primary">
        {text.slice(index, index + q.length)}
      </mark>
      {text.slice(index + q.length)}
    </>
  );
}

export function CommandPalette() {
  const router = useRouter();
  const org = useCurrentOrg();
  const flags = useFlags();
  const qc = useQueryClient();
  const { isDemo, showDemoLimitation } = useDemoLimitation("command_palette");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [recent, setRecent] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(RECENT_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });
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

  function remember(label: string) {
    setRecent((current) => {
      const next = [label, ...current.filter((item) => item !== label)].slice(0, 3);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // Recent commands are a convenience only.
      }
      return next;
    });
  }

  function navigate(label: string, href: string) {
    remember(label);
    router.push(href);
    setOpen(false);
  }

  function isMutableRecentLabel(label: string) {
    return (
      label.startsWith("Generate ") ||
      label.startsWith("Approve ") ||
      label.startsWith("Reject ")
    );
  }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["org", org.id, "signals"] });
    qc.invalidateQueries({ queryKey: ["org", org.id, "accounts"] });
  };

  const generate = useMutation({
    mutationFn: (signalId: string) => generatePlaybookForSignal(org.id, signalId),
    onSuccess: () => {
      invalidate();
      toast.success("Playbook generation queued", {
        description: "We will notify you when the generated playbook is ready.",
      });
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
      remember(`${variables.action === "approve" ? "Approve" : "Reject"} ${variables.accountName}`);
      toast.success(
        variables.action === "approve" ? "Signal approved" : "Signal rejected",
        { description: variables.accountName }
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
    <AnimatedDialog
      open={open}
      onClose={() => setOpen(false)}
      labelledBy="command-palette-title"
      align="top"
      className="max-w-2xl overflow-hidden"
    >
      <Command className="bg-card">
        <h2 id="command-palette-title" className="sr-only">
          Command palette
        </h2>
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            aria-label="Search commands, accounts, and signal actions"
            placeholder="Search accounts or run actions..."
            className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-background/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            Esc
          </kbd>
        </div>
        <Command.List className="max-h-[420px] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface"
            >
              <Search className="h-4 w-4" />
            </motion.div>
            No results found. Try an account name, &quot;approve&quot;, or
            &quot;generate&quot;.
          </Command.Empty>

          {recent.length > 0 && (
            <Command.Group heading="Recently used" className="text-xs text-muted-foreground">
              {recent.map((label) => (
                <Command.Item
                  key={label}
                  value={`recent ${label}`}
                  onSelect={() => {
                    const nav = NAV_ITEMS.find((item) => item.label === label);
                    if (nav) navigate(nav.label, nav.href);
                    else if (label.startsWith("Generate ")) {
                      if (isDemo) {
                        showDemoLimitation("generate_playbook_recent");
                        return;
                      }
                      const accountName = label.replace("Generate ", "");
                      const signal = signalsByAccount.get(accountName);
                      if (signal) generate.mutate(signal.id);
                    } else if (label.startsWith("Approve ")) {
                      if (isDemo) {
                        showDemoLimitation("approve_signal_recent");
                        return;
                      }
                      transition.mutate({
                        action: "approve",
                        accountName: label.replace("Approve ", ""),
                      });
                    } else if (label.startsWith("Reject ")) {
                      if (isDemo) {
                        showDemoLimitation("reject_signal_recent");
                        return;
                      }
                      transition.mutate({
                        action: "reject",
                        accountName: label.replace("Reject ", ""),
                      });
                    }
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground aria-selected:bg-primary/10 aria-selected:text-primary",
                    isDemo && isMutableRecentLabel(label) && "cursor-not-allowed opacity-55"
                  )}
                >
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <Highlight text={label} query={search} />
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group heading="Navigate" className="text-xs text-muted-foreground">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
              <Command.Item
                key={href}
                value={label}
                onSelect={() => navigate(label, href)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <Highlight text={label} query={search} />
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Accounts" className="mt-2 text-xs text-muted-foreground">
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
                      if (isDemo) {
                        showDemoLimitation("generate_playbook");
                        return;
                      }
                      remember(`Generate ${account.name}`);
                      generate.mutate(signal.id);
                    } else {
                      navigate("Go to Accounts", "/accounts");
                    }
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-foreground aria-selected:bg-primary/10 aria-selected:text-primary",
                    isDemo && canGenerate && "cursor-not-allowed opacity-55"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      <Highlight text={account.name} query={search} />
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {account.domain ?? account.industry ?? "Account"}
                    </span>
                  </span>
                  {canGenerate && (
                    <Badge variant="brand">
                      <Sparkles className="h-3.5 w-3.5" />
                      {isDemo ? "Locked" : "Generate"}
                    </Badge>
                  )}
                </Command.Item>
              );
            })}
          </Command.Group>

          <Command.Group heading="Signals" className="mt-2 text-xs text-muted-foreground">
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
                      onSelect={() => {
                        if (isDemo) {
                          showDemoLimitation("approve_signal");
                          return;
                        }
                        transition.mutate({
                          action: "approve",
                          accountName: name,
                        });
                      }}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground aria-selected:bg-success/10 aria-selected:text-success",
                        isDemo && "cursor-not-allowed opacity-55"
                      )}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      <span>
                        Approve <Highlight text={name} query={search} />
                      </span>
                    </Command.Item>
                  )}
                  {canReject && (
                    <Command.Item
                      value={`reject ${name}`}
                      onSelect={() => {
                        if (isDemo) {
                          showDemoLimitation("reject_signal");
                          return;
                        }
                        transition.mutate({
                          action: "reject",
                          accountName: name,
                        });
                      }}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground aria-selected:bg-destructive/10 aria-selected:text-destructive",
                        isDemo && "cursor-not-allowed opacity-55"
                      )}
                    >
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                      <span>
                        Reject <Highlight text={name} query={search} />
                      </span>
                    </Command.Item>
                  )}
                </div>
              );
            })}
          </Command.Group>
        </Command.List>
      </Command>
    </AnimatedDialog>
  );
}
