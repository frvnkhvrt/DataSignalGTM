"use client";

import { useState } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Dismiss */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-4 top-4 text-zinc-600 hover:text-zinc-400"
          aria-label="Skip onboarding"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 px-6 pt-5">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? "w-6 bg-emerald-400"
                  : i < step
                    ? "w-1.5 bg-emerald-800"
                    : "w-1.5 bg-zinc-800"
              }`}
              aria-label={`Step ${i + 1}`}
            />
          ))}
          <span className="ml-auto text-xs text-zinc-600">
            {step + 1} / {STEPS.length}
          </span>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
            {current.icon}
          </div>
          <h2 className="mb-2 text-lg font-semibold text-zinc-100">
            {current.title}
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            {current.description}
          </p>
        </div>

        {/* Checklist on last step */}
        {isLast && (
          <div className="mx-6 mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Quick-start checklist
            </p>
            {[
              "Review pending signals on the Signals page",
              "Generate an AI playbook for a high-score account",
              "Connect an intent data source via webhook",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 py-1 text-xs text-zinc-400">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-700" />
                {item}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs text-zinc-600 hover:text-zinc-400"
          >
            Skip
          </button>

          <button
            type="button"
            disabled={completing}
            onClick={isLast ? handleComplete : () => setStep((s) => s + 1)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {current.cta}
            {!isLast && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
