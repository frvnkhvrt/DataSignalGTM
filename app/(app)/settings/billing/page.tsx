"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Loader2, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useCurrentOrg } from "@/lib/auth-context";
import { PLANS, type PlanTier } from "@/lib/stripe";

function useCurrentSubscription(orgId: string) {
  return useQuery({
    queryKey: ["org", orgId, "subscription"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("org_id", orgId)
        .eq("status", "active")
        .maybeSingle();
      return data ?? null;
    },
  });
}

function useOrgTier(orgId: string) {
  return useQuery({
    queryKey: ["org", orgId, "tier"],
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("subscription_tier")
        .eq("id", orgId)
        .single();
      return (data?.subscription_tier ?? "free") as PlanTier;
    },
  });
}

function PlanCard({
  plan,
  currentTier,
  onUpgrade,
  onManage,
  upgrading,
}: {
  plan: (typeof PLANS)[number];
  currentTier: PlanTier;
  onUpgrade: () => void;
  onManage: () => void;
  upgrading: boolean;
}) {
  const isCurrent = plan.id === currentTier;
  const isDowngrade = plan.id === "free" && currentTier !== "free";

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-6 ${
        plan.highlighted
          ? "border-emerald-500/60 bg-emerald-950/20"
          : "border-zinc-800 bg-zinc-900"
      }`}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-zinc-950">
            <Zap className="h-3 w-3" />
            Most popular
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-base font-semibold text-zinc-100">{plan.name}</h3>
        <p className="text-xs text-zinc-500">{plan.tagline}</p>
        <div className="mt-3 flex items-end gap-1.5">
          <span className="text-3xl font-bold text-zinc-100">{plan.price}</span>
          <span className="mb-1 text-xs text-zinc-500">{plan.priceSub}</span>
        </div>
      </div>

      <ul className="mb-6 flex-1 space-y-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-zinc-300">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
            {f}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <div className="flex gap-2">
          <div className="flex-1 rounded-lg border border-zinc-700 px-3 py-2 text-center text-xs font-medium text-zinc-500">
            Current plan
          </div>
          {currentTier !== "free" && (
            <button
              type="button"
              onClick={onManage}
              disabled={upgrading}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Manage
            </button>
          )}
        </div>
      ) : plan.id === "enterprise" ? (
        <a
          href="mailto:sales@datasignalgtm.com?subject=Enterprise inquiry"
          className="block rounded-lg border border-zinc-700 px-3 py-2 text-center text-xs font-medium text-zinc-300 hover:bg-zinc-800"
        >
          {plan.cta}
        </a>
      ) : isDowngrade ? (
        <button
          type="button"
          onClick={onManage}
          disabled={upgrading}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
        >
          Manage in portal
        </button>
      ) : (
        <button
          type="button"
          onClick={onUpgrade}
          disabled={upgrading}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
            plan.highlighted
              ? "bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
              : "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          }`}
        >
          {upgrading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {plan.cta}
        </button>
      )}
    </div>
  );
}

export default function BillingPage() {
  const org = useCurrentOrg();
  const { data: tier = "free" } = useOrgTier(org.id);
  const { data: subscription } = useCurrentSubscription(org.id);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(priceId?: string) {
    setLoading("upgrade");
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });
    const body = await res.json() as { url?: string; error?: string };
    if (body.url) {
      window.location.href = body.url;
    } else {
      alert(body.error ?? "Upgrade failed. Please try again.");
      setLoading(null);
    }
  }

  async function handleManage() {
    setLoading("manage");
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const body = await res.json() as { url?: string; error?: string };
    if (body.url) {
      window.location.href = body.url;
    } else {
      alert(body.error ?? "Could not open portal. Please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100 sm:text-2xl">
          Billing &amp; Plan
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your subscription and billing details.
        </p>
      </div>

      {subscription && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
          <span className="font-medium text-zinc-100">Current period ends:</span>{" "}
          {subscription.current_period_end
            ? new Date(subscription.current_period_end).toLocaleDateString()
            : "—"}
          {subscription.cancel_at_period_end && (
            <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] text-amber-300">
              Cancels at period end
            </span>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentTier={tier}
            onUpgrade={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? undefined : undefined)}
            onManage={handleManage}
            upgrading={loading !== null}
          />
        ))}
      </div>

      <p className="text-xs text-zinc-600">
        Payments powered by Stripe. Cancel anytime. All prices in USD.
      </p>
    </div>
  );
}
