/**
 * Server-only Stripe client and plan definitions.
 * Import only from API routes and server functions — never from client components.
 */
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is not configured. Add it to .env.local to enable billing."
      );
    }
    _stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
  }
  return _stripe;
}

// ── Plan definitions ──────────────────────────────────────────────────────────

export type PlanTier = "free" | "pro" | "enterprise";

export interface Plan {
  id: PlanTier;
  name: string;
  tagline: string;
  price: string;
  priceSub: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Start capturing signals",
    price: "$0",
    priceSub: "forever",
    features: [
      "Up to 50 signals / month",
      "1 organisation",
      "Basic dashboard",
      "AI playbooks (5 / month)",
      "Community support",
    ],
    cta: "Get started free",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Scale your GTM engine",
    price: "$99",
    priceSub: "per month",
    features: [
      "Unlimited signals",
      "Up to 5 organisations",
      "Advanced charts & analytics",
      "Unlimited AI playbooks",
      "Rules engine & bulk actions",
      "Webhook signal ingestion",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom scale, dedicated support",
    price: "Custom",
    priceSub: "contact us",
    features: [
      "Everything in Pro",
      "Unlimited organisations",
      "SSO / SAML",
      "Custom AI model integrations",
      "Dedicated customer success",
      "SLA guarantees",
      "Custom data retention",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

// ── Plan limits ───────────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<PlanTier, { signalsPerMonth: number; playbooksPerMonth: number }> = {
  free: { signalsPerMonth: 50, playbooksPerMonth: 5 },
  pro: { signalsPerMonth: Infinity, playbooksPerMonth: Infinity },
  enterprise: { signalsPerMonth: Infinity, playbooksPerMonth: Infinity },
};

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}
