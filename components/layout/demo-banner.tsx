"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Eye, LogOut, RotateCcw, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase/client";
import { transitionDemoBanner } from "@/components/ui/motion";

export function DemoBanner() {
  const { isDemo, org } = useAuthContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isExitPending, startExitTransition] = useTransition();
  const [isResetPending, startResetTransition] = useTransition();
  const reducedMotion = useReducedMotion();

  if (!isDemo) return null;

  function exitDemoMode() {
    startExitTransition(async () => {
      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    });
  }

  function resetDemoData() {
    startResetTransition(async () => {
      const response = await fetch("/api/demo/reset", { method: "POST" });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        toast.error(body?.error ?? "Could not reset demo data. Please try again.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["org", org.id] });
      toast.success(body?.message ?? "Demo data reset successfully.");
      router.refresh();
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        key="demo-banner"
        role="region"
        aria-label="Demo mode notice"
        initial={
          reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }
        }
        animate={{ opacity: 1, y: 0 }}
        exit={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
        transition={
          reducedMotion ? { duration: 0.01 } : transitionDemoBanner
        }
        className="border-b border-warning/25 bg-gradient-to-r from-warning/12 via-background/80 to-info/10 px-4 py-3 text-foreground backdrop-blur-xl sm:px-6"
      >
        <div className="rounded-xl border border-warning/25 bg-background/45 px-4 py-3 shadow-soft ds-card-inner-glow">
          <motion.div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-warning/35 bg-warning/15 text-warning">
                <Eye className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">
                    You are viewing a demo environment
                  </p>
                  <Badge variant="success" shape="pill">
                    <ShieldCheck className="h-3 w-3" />
                    Sample data
                  </Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Explore accounts, signals, data quality, and playbooks without
                  touching a real environment.
                </p>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-warning/85">
                  <li>Read-only — signal approvals disabled</li>
                  <li>AI playbook generation disabled</li>
                  <li>Billing and automations disabled</li>
                </ul>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetDemoData}
                disabled={isResetPending || isExitPending}
              >
                {isResetPending ? (
                  <Spinner size="md" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                {isResetPending ? "Resetting…" : "Reset Demo Data"}
              </Button>
              <Button
                type="button"
                onClick={exitDemoMode}
                disabled={isExitPending || isResetPending}
                variant="warning"
                size="sm"
              >
                {isExitPending ? (
                  <Spinner size="md" />
                ) : (
                  <LogOut className="h-3.5 w-3.5" />
                )}
                Exit demo
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
