"use client";

import { useState } from "react";
import { Copy, X } from "lucide-react";
import { toast } from "sonner";
import type { AccountRow } from "@/lib/gtm-queries";
import { AnimatedDialog } from "@/components/ui/animated-dialog";
import { Button } from "@/components/ui/button";

function draftMessage(account: AccountRow): string {
  const employees =
    account.employee_count != null
      ? `${account.employee_count.toLocaleString()} employees`
      : "size unknown";

  return `Hi ${account.name},

Opening note for your CRM (from DataSignalGTM):
- Industry: ${account.industry ?? "n/a"}
- ${employees}
- ICP fit score in workspace: ${account.icp_fit_score ?? 0}/100

We can align on what triggered this account if you want to continue the thread.

-`;
}

export function EngageModal({
  account,
  onClose,
}: {
  account: AccountRow | null;
  onClose: () => void;
}) {
  return (
    <AnimatedDialog
      open={!!account}
      onClose={onClose}
      labelledBy="engage-title"
      className="max-w-lg overflow-hidden"
    >
      {account && (
        <EngageModalContent key={account.id} account={account} onClose={onClose} />
      )}
    </AnimatedDialog>
  );
}

function EngageModalContent({
  account,
  onClose,
}: {
  account: AccountRow;
  onClose: () => void;
}) {
  const [message, setMessage] = useState(() => draftMessage(account));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Draft copied", {
        description: `${account.name} is ready to paste into your sequence.`,
      });
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div id="engage-title" className="text-sm font-semibold text-foreground">
              {account.name}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Edit the note before copying it into your sequence.
            </div>
          </div>
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            size="icon"
            aria-label="Close engage modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-5 py-4">
          <label
            htmlFor="engage-draft"
            className="mb-2 block text-xs text-muted-foreground"
          >
            Message draft
          </label>
          <textarea
            id="engage-draft"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="ds-focus-ring h-56 w-full resize-y rounded-md border border-input bg-background/60 p-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            size="sm"
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={copy}
            size="sm"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
        </div>
    </>
  );
}
