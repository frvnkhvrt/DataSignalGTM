"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Loader2, RotateCcw, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Badge variant="warning" className="mb-3">
          <ShieldAlert className="h-3 w-3" />
          Internal
        </Badge>
        <h1 className="ds-heading text-2xl font-semibold text-foreground sm:text-3xl">
          Admin
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Internal tools for demo management. These actions are irreversible.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <CardTitle>Reset Demo Data</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Clears all data and restores the canonical demo state — accounts,
            signals, playbooks, and data issues. This action cannot be undone.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="reset-key"
              className="text-xs font-medium text-muted-foreground"
            >
              Reset key
            </label>
            <Input
              id="reset-key"
              type="password"
              value={resetKey}
              onChange={(e) => setResetKey(e.target.value)}
              placeholder="Enter DEMO_RESET_KEY"
              disabled={reset.isPending}
            />
          </div>

          {!showConfirm ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setShowConfirm(true)}
              disabled={!resetKey.trim() || reset.isPending}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Demo Data
            </Button>
          ) : (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <p className="text-xs leading-5 text-destructive">
                All current data will be permanently deleted and replaced with
                demo defaults. This cannot be undone. Continue?
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => reset.mutate()}
                  disabled={reset.isPending}
                >
                  {reset.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  Confirm Reset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfirm(false)}
                  disabled={reset.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
