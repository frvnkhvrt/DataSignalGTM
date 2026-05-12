"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Loader2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useCurrentOrg } from "@/lib/auth-context";
import { PLANS, type PlanTier } from "@/lib/stripe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stagger, StaggerItem } from "@/components/ui/motion";

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
    <Card
      className={`relative flex flex-col bg-card/80 ${
        plan.highlighted ? "border-primary/50 shadow-glow" : ""
      }`}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="brand" className="bg-primary text-primary-foreground">
            <Zap className="h-3 w-3" />
            Most popular
          </Badge>
        </div>
      )}

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="ds-heading text-xl">{plan.name}</CardTitle>
          {isCurrent && <Badge variant="success">Current</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{plan.tagline}</p>
        <div className="mt-3 flex items-end gap-1.5">
          <span className="font-mono text-3xl font-semibold text-foreground">
            {plan.price}
          </span>
          <span className="mb-1 text-xs text-muted-foreground">{plan.priceSub}</span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
      <ul className="mb-6 flex-1 space-y-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            {f}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <div className="flex gap-2">
          <div className="flex-1 rounded-lg border border-border px-3 py-2 text-center text-xs font-medium text-muted-foreground">
            Current plan
          </div>
          {currentTier !== "free" && (
            <Button
              type="button"
              onClick={onManage}
              disabled={upgrading}
              variant="outline"
              size="sm"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Manage
            </Button>
          )}
        </div>
      ) : plan.id === "enterprise" ? (
        <a
          href="mailto:sales@datasignalgtm.com?subject=Enterprise inquiry"
          className="ds-focus-ring ds-pressable block rounded-lg border border-border px-3 py-2 text-center text-xs font-medium text-foreground hover:bg-surface-elevated"
        >
          {plan.cta}
        </a>
      ) : isDowngrade ? (
        <Button
          type="button"
          onClick={onManage}
          disabled={upgrading}
          variant="outline"
          size="sm"
        >
          Manage in portal
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onUpgrade}
          disabled={upgrading}
          variant={plan.highlighted ? "default" : "outline"}
          size="sm"
        >
          {upgrading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {plan.cta}
        </Button>
      )}
      </CardContent>
    </Card>
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
      toast.error(body.error ?? "Upgrade failed. Please try again.");
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
      toast.error(body.error ?? "Could not open portal. Please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-soft">
        <Badge variant="brand" className="mb-3">
          <ShieldCheck className="h-3 w-3" />
          Billing
        </Badge>
        <h1 className="ds-heading text-3xl font-semibold text-foreground">
          Plan, limits, and billing
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Choose the capacity that matches your GTM motion. Free is for setup,
          Pro removes operational limits, and Enterprise adds governance.
        </p>
      </div>

      {subscription && (
        <Card className="bg-card/80 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Current period ends:</span>{" "}
          {subscription.current_period_end
            ? new Date(subscription.current_period_end).toLocaleDateString()
            : "—"}
          {subscription.cancel_at_period_end && (
            <Badge variant="warning" className="ml-2">
              Cancels at period end
            </Badge>
          )}
        </Card>
      )}

      <Stagger className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <StaggerItem key={plan.id}>
            <PlanCard
              plan={plan}
              currentTier={tier}
              onUpgrade={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? undefined : undefined)}
              onManage={handleManage}
              upgrading={loading !== null}
            />
          </StaggerItem>
        ))}
      </Stagger>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Payments powered by Stripe. Cancel anytime. All prices in USD.
      </div>
    </div>
  );
}
