"use client";

import { useState } from "react";
import { Copy, X } from "lucide-react";
import { toast } from "sonner";
import type { AccountRow } from "@/lib/gtm-queries";

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
  if (!account) return null;

  return <EngageModalContent key={account.id} account={account} onClose={onClose} />;
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
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 shadow-lg"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="engage-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <div id="engage-title" className="text-sm font-semibold text-zinc-100">
              {account.name}
            </div>
            <div className="mt-0.5 text-xs text-zinc-500">
              Edit the note before copying it into your sequence.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Close engage modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">
          <label
            htmlFor="engage-draft"
            className="mb-2 block text-xs text-zinc-500"
          >
            Message draft
          </label>
          <textarea
            id="engage-draft"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="h-56 w-full resize-y rounded-md border border-zinc-800 bg-zinc-950 p-3 text-sm leading-relaxed text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            Close
          </button>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-400 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-emerald-300"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
