-- Phase 3: Observability, performance indexes, and dashboard materialized view.

-- ── ai_usage table ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  signal_id        uuid REFERENCES public.signals(id) ON DELETE SET NULL,
  model            text NOT NULL DEFAULT 'gemini-2.0-flash-lite',
  duration_ms      integer,
  success          boolean NOT NULL DEFAULT true,
  error_message    text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Org members can read their org's usage data.
CREATE POLICY "org members can read ai_usage"
  ON public.ai_usage FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Only the service role can insert (Inngest worker uses the admin client).
CREATE POLICY "service role can insert ai_usage"
  ON public.ai_usage FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS ai_usage_org_id_created_at_idx
  ON public.ai_usage (org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_usage_org_id_success_idx
  ON public.ai_usage (org_id, success);

-- ── Performance indexes on existing high-traffic tables ──────────────────────

CREATE INDEX IF NOT EXISTS signals_org_id_status_idx
  ON public.signals (org_id, status);

CREATE INDEX IF NOT EXISTS signals_org_id_created_at_idx
  ON public.signals (org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS signals_org_id_playbook_status_idx
  ON public.signals (org_id, playbook_status);

CREATE INDEX IF NOT EXISTS accounts_org_id_dq_idx
  ON public.accounts (org_id, data_quality_score DESC);

CREATE INDEX IF NOT EXISTS accounts_org_id_icp_idx
  ON public.accounts (org_id, icp_fit_score DESC);

CREATE INDEX IF NOT EXISTS data_issues_org_id_status_idx
  ON public.data_issues (org_id, status);

-- ── Dashboard summary materialized view ──────────────────────────────────────
-- Refreshed on-demand via the /api/admin/refresh-stats route.

CREATE MATERIALIZED VIEW IF NOT EXISTS public.dashboard_stats AS
SELECT
  a.org_id,
  COUNT(DISTINCT a.id)                                           AS total_accounts,
  ROUND(AVG(a.data_quality_score))::integer                      AS avg_dq_score,
  ROUND(AVG(a.icp_fit_score))::integer                           AS avg_icp_score,
  COUNT(DISTINCT a.id) FILTER (
    WHERE a.data_quality_score >= 90
  )                                                              AS healthy_accounts,
  COUNT(DISTINCT s.id)                                           AS total_signals,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'pending')      AS pending_signals,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'held')         AS held_signals,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'approved')     AS approved_signals,
  COUNT(DISTINCT s.id) FILTER (
    WHERE s.playbook IS NOT NULL
  )                                                              AS signals_with_playbook,
  NOW()                                                          AS refreshed_at
FROM public.accounts a
LEFT JOIN public.signals s ON s.org_id = a.org_id
GROUP BY a.org_id;

-- Unique index required for REFRESH CONCURRENTLY.
CREATE UNIQUE INDEX IF NOT EXISTS dashboard_stats_org_id_uidx
  ON public.dashboard_stats (org_id);
