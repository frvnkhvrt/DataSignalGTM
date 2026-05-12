"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";

export default function AdminPage() {
  const [resetKey, setResetKey] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const qc = useQueryClient();

  const reset = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/demo-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: resetKey }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Reset failed");
      return body;
    },
    onSuccess: () => {
      toast.success("Demo data reset successfully");
      setShowConfirm(false);
      setResetKey("");
      qc.invalidateQueries();
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Reset failed"),
  });

  return (
    <div className="p-6 sm:p-8 max-w-[600px] space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100">
          Admin
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Internal tools for demo management.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-zinc-100">
            Reset Demo Data
          </h2>
        </div>
        <p className="text-xs text-zinc-400">
          Clears all data and restores the canonical demo state (accounts,
          signals, playbooks, data issues). This action cannot be undone.
        </p>
        <div>
          <label
            htmlFor="reset-key"
            className="text-xs text-zinc-500 block mb-1"
          >
            Reset key
          </label>
          <input
            id="reset-key"
            type="password"
            value={resetKey}
            onChange={(e) => setResetKey(e.target.value)}
            placeholder="Enter DEMO_RESET_KEY"
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          />
        </div>

        {!showConfirm ? (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={!resetKey.trim()}
            className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-md border border-red-500/40 text-red-300 font-medium hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Demo Data
          </button>
        ) : (
          <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3 space-y-3">
            <p className="text-xs text-red-300">
              All current data will be permanently deleted and replaced with
              demo defaults. Continue?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => reset.mutate()}
                disabled={reset.isPending}
                className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-md bg-red-500 text-white font-medium hover:bg-red-400 disabled:opacity-50"
              >
                {reset.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={reset.isPending}
                className="text-xs px-3 py-2 rounded-md border border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
