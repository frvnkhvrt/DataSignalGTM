-- Phase 2: Persist playbook background job state on signals.

ALTER TABLE public.signals
  ADD COLUMN IF NOT EXISTS playbook_status text NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS playbook_error text,
  ADD COLUMN IF NOT EXISTS playbook_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS playbook_generated_at timestamptz;

ALTER TABLE public.signals
  DROP CONSTRAINT IF EXISTS signals_playbook_status_check;

ALTER TABLE public.signals
  ADD CONSTRAINT signals_playbook_status_check
  CHECK (playbook_status IN ('idle', 'queued', 'generating', 'completed', 'failed'));

UPDATE public.signals
SET playbook_status = CASE
    WHEN playbook IS NOT NULL THEN 'completed'
    ELSE 'idle'
  END,
  playbook_generated_at = CASE
    WHEN playbook IS NOT NULL THEN COALESCE(playbook_generated_at, updated_at, created_at, now())
    ELSE playbook_generated_at
  END;

CREATE INDEX IF NOT EXISTS signals_org_id_playbook_status_idx
  ON public.signals (org_id, playbook_status);
