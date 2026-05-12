-- Phase 4: Stripe subscriptions, onboarding tracking, and plan limits.

-- ── Plan tier on organisations ───────────────────────────────────────────────

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS subscription_tier  text NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- ── Subscriptions table ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                   text PRIMARY KEY,               -- Stripe subscription ID
  org_id               uuid  NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id          text  NOT NULL,                 -- Stripe customer ID
  status               text  NOT NULL,                 -- active | trialing | past_due | canceled | …
  price_id             text,
  current_period_end   timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS subscriptions_org_id_idx ON public.subscriptions (org_id);
CREATE INDEX IF NOT EXISTS subscriptions_customer_id_idx ON public.subscriptions (customer_id);

-- ── Onboarding tracking on profiles ──────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Backfill existing profiles as already completed so existing users skip onboarding.
UPDATE public.profiles
  SET onboarding_completed = true,
      onboarding_completed_at = now()
WHERE onboarding_completed = false;
