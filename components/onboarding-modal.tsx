"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Plug,
  Target,
  X,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuthContext } from "@/lib/auth-context";
import { track } from "@/lib/analytics";
import { AnimatedDialog } from "@/components/ui/animated-dialog";
import { Button } from "@/components/ui/button";

interface Step {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
}

const STEPS: Step[] = [
  {
    id: "welcome",
    icon: <Zap className="h-6 w-6 text-emerald-400" />,
    title: "Welcome to DataSignalGTM",
    description:
      "You've just set up the GTM signal layer that turns intent data into revenue. Let's walk you through the key concepts in 60 seconds.",
    cta: "Get started",
  },
  {
    id: "signals",
    icon: <Target className="h-6 w-6 text-violet-400" />,
    title: "Understand signals & scoring",
    description:
      "Every account gets a composite score from velocity, intent, fit, and timing signals. Pending signals await your review — approve them to move accounts into the active pipeline.",
    cta: "Got it",
  },
  {
    id: "playbooks",
    icon: <Brain className="h-6 w-6 text-cyan-400" />,
    title: "Generate AI playbooks",
    description:
      "Click \"Generate playbook\" on any signal to queue an AI-powered outreach strategy via Gemini. Jobs run in the background and your dashboard updates in real-time.",
    cta: "Sounds good",
  },
  {
    id: "sources",
    icon: <Plug className="h-6 w-6 text-amber-400" />,
    title: "Connect your data sources",
    description:
      "Push signals from any tool using our webhook endpoint (POST /api/webhooks/signals). Supports Clearbit, 6sense, Bombora, Apollo, and any custom source.",
    cta: "Let's go →",
  },
];

export function OnboardingModal({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const { user } = useAuthContext();
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);
  const reducedMotion = useReducedMotion();

  async function handleComplete() {
    setCompleting(true);
    try {
      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      track({
        event: "dashboard_viewed",
        properties: { org_id: "onboarding_completed" },
      });
    } catch {
      // If it fails, silently continue — don't block the user.
    }
    onComplete();
  }

  function handleDismiss() {
    void handleComplete();
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatedDialog
      open
      onClose={handleDismiss}
      labelledBy="onboarding-title"
      className="relative max-w-md overflow-hidden rounded-2xl"
    >
        {/* Dismiss */}
        <Button
          type="button"
          onClick={handleDismiss}
          className="absolute right-4 top-4"
          variant="ghost"
          size="icon"
          aria-label="Skip onboarding"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 px-6 pt-5">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? "w-6 bg-primary shadow-glow"
                  : i < step
                    ? "w-1.5 bg-primary/35"
                    : "w-1.5 bg-muted"
              }`}
              aria-label={`Step ${i + 1}`}
            />
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {step + 1} / {STEPS.length}
          </span>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={reducedMotion ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="px-6 py-6"
          >
            <div className="ds-empty-orb mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border">
              {current.icon}
            </div>
            <h2 id="onboarding-title" className="ds-heading mb-2 text-lg font-semibold text-foreground">
              {current.title}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {current.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Checklist on last step */}
        {isLast && (
          <div className="mx-6 mb-6 rounded-lg border border-border bg-surface p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quick-start checklist
            </p>
            {[
              "Review pending signals on the Signals page",
              "Generate an AI playbook for a high-score account",
              "Connect an intent data source via webhook",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 py-1 text-xs text-muted-foreground">
                <CheckCircle2 className="ds-success-pop mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                {item}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <Button
            type="button"
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
          >
            Skip
          </Button>

          <Button
            type="button"
            disabled={completing}
            onClick={isLast ? handleComplete : () => setStep((s) => s + 1)}
            size="lg"
          >
            {current.cta}
            {!isLast && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
    </AnimatedDialog>
  );
}
