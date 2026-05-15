"use client";

import { useState } from "react";
import { Copy, X } from "lucide-react";
import { toast } from "sonner";
import type { AccountRow } from "@/lib/gtm-queries";
import { Dialog, DialogMotionContent, DialogTitle } from "@/components/ui/dialog";
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
    <Dialog open={!!account} onOpenChange={(next) => !next && onClose()}>
      <DialogMotionContent
        open={!!account}
        align="center"
        showCloseButton={false}
        className="max-w-lg overflow-hidden p-0 shadow-none"
      >
        {account && (
          <EngageModalContent key={account.id} account={account} onClose={onClose} />
        )}
      </DialogMotionContent>
    </Dialog>
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
        <div className="relative flex items-center justify-between px-5 py-4">
          <div>
            <DialogTitle id="engage-title" className="text-sm font-semibold text-foreground">
              {account.name}
            </DialogTitle>
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
          <div className="ds-separator pointer-events-none absolute inset-x-0 bottom-0" aria-hidden />
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
            className="ds-focus-ring ds-input-well h-56 w-full resize-y rounded-md border border-input bg-background/60 p-3 text-sm leading-relaxed text-foreground transition-[border-color,box-shadow] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] placeholder:text-muted-foreground hover:border-border/90 focus-visible:border-ring/60"
          />
        </div>
        <div className="relative flex items-center justify-end gap-2 px-5 pb-3 pt-4">
          <div className="ds-separator pointer-events-none absolute inset-x-0 top-0" aria-hidden />
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
