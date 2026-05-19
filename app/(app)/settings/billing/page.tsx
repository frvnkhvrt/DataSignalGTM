"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { useCurrentOrg } from "@/lib/auth-context";
import { orgTierQuery, subscriptionQuery } from "@/lib/queries/billing";
import { PLANS, type PlanTier } from "@/lib/stripe";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { QueryError } from "@/components/ui/query-error";
import { Spinner } from "@/components/ui/spinner";

function PlanCard({
  plan,
  currentTier,
  onUpgrade,
  onManage,
  loadingAction,
}: {
  plan: (typeof PLANS)[number];
  currentTier: PlanTier;
  onUpgrade: () => void;
  onManage: () => void;
  loadingAction: string | null;
}) {
  const isCurrent = plan.id === currentTier;
  const isDowngrade = plan.id === "free" && currentTier !== "free";
  const isUpgrading = loadingAction === `upgrade-${plan.id}`;
  const isManaging = loadingAction === "manage";

  return (
    <Card
      variant="translucent"
      elevated={plan.highlighted}
      className={cn(
        "group relative flex flex-col transition-[transform,box-shadow,border-color,background-color] duration-[var(--ds-duration-smooth)] ease-[var(--ease-premium)] hover:shadow-elevated",
        plan.highlighted
          ? "border-primary/50 pt-9 shadow-glow hover:border-primary/70"
          : "hover:border-border/80"
      )}
    >
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-[var(--ds-duration-smooth)] ease-[var(--ease-premium)] group-hover:opacity-100" />
      {plan.highlighted && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Badge className="bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-glow" shape="pill">
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
              disabled={!!loadingAction}
              variant="outline"
              size="sm"
            >
              {isManaging ? (
                <Spinner size="md" />
              ) : (
                <ExternalLink className="h-3.5 w-3.5" />
              )}
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
          disabled={!!loadingAction}
          variant="outline"
          size="sm"
        >
          {isManaging && <Spinner size="md" />}
          Manage in portal
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onUpgrade}
          disabled={!!loadingAction}
          variant={plan.highlighted ? "default" : "outline"}
          size="sm"
        >
          {isUpgrading && <Spinner size="md" />}
          {plan.cta}
        </Button>
      )}
      </CardContent>
    </Card>
  );
}

export default function BillingPage() {
  const org = useCurrentOrg();
  const { data: tier = "free", isError: tierError, refetch: refetchTier } =
    useQuery(orgTierQuery(org.id));
  const { data: subscription } = useQuery(subscriptionQuery(org.id));
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  async function handleUpgrade(planId: string) {
    setLoadingAction(`upgrade-${planId}`);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // priceId is resolved server-side from STRIPE_PRO_PRICE_ID; send undefined to use default
      body: JSON.stringify({}),
    });
    const body = await res.json() as { url?: string; error?: string };
    if (body.url) {
      window.location.assign(body.url);
    } else {
      toast.error(body.error ?? "Upgrade failed. Please try again.");
      setLoadingAction(null);
    }
  }

  async function handleManage() {
    setLoadingAction("manage");
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const body = await res.json() as { url?: string; error?: string };
    if (body.url) {
      window.location.assign(body.url);
    } else {
      toast.error(body.error ?? "Could not open portal. Please try again.");
      setLoadingAction(null);
    }
  }

  if (tierError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <QueryError
          message="Could not load billing information. Try refreshing."
          onRetry={() => void refetchTier()}
          className="mx-auto max-w-lg"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Billing"
        title="Plan, limits &amp; billing"
        description="Choose the capacity that matches your GTM motion. Free is for setup, Pro removes operational limits, and Enterprise adds governance."
      />

      {subscription && (
        <Card variant="translucent" className="px-4 py-3 text-sm text-muted-foreground shadow-soft">
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

      <Stagger className="grid gap-4 pt-5 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <StaggerItem key={plan.id}>
            <PlanCard
              plan={plan}
              currentTier={tier}
              onUpgrade={() => handleUpgrade(plan.id)}
              onManage={handleManage}
              loadingAction={loadingAction}
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
