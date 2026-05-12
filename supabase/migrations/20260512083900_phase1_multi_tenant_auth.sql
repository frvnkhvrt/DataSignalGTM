-- Phase 1: Supabase Auth, organizations, secure RLS, and org-scoped demo data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE public.organization_role AS ENUM ('admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  role public.organization_role NOT NULL DEFAULT 'member',
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.organization_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS organizations_set_updated_at ON public.organizations;
CREATE TRIGGER organizations_set_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.organizations (id, name, slug)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'DataSignal Demo',
  'datasignal-demo'
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    slug = EXCLUDED.slug;

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-4000-8000-000000000002',
  'authenticated',
  'authenticated',
  'demo@datasignalgtm.local',
  crypt('datasignal-demo-password', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Demo User"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000002',
  jsonb_build_object(
    'sub', '00000000-0000-4000-8000-000000000002',
    'email', 'demo@datasignalgtm.local',
    'email_verified', true
  ),
  'email',
  'demo@datasignalgtm.local',
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (
  id,
  org_id,
  role,
  full_name,
  avatar_url
)
VALUES (
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'admin',
  'Demo User',
  NULL
)
ON CONFLICT (id) DO UPDATE
SET org_id = EXCLUDED.org_id,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

INSERT INTO public.organization_members (org_id, user_id, role)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  'admin'
)
ON CONFLICT (org_id, user_id) DO UPDATE
SET role = EXCLUDED.role;

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS org_id uuid;

ALTER TABLE public.signals
  ADD COLUMN IF NOT EXISTS org_id uuid;

ALTER TABLE public.data_issues
  ADD COLUMN IF NOT EXISTS org_id uuid;

ALTER TABLE public.audit_trail
  ADD COLUMN IF NOT EXISTS org_id uuid;

UPDATE public.accounts
SET org_id = '00000000-0000-4000-8000-000000000001'
WHERE org_id IS NULL;

UPDATE public.signals
SET org_id = '00000000-0000-4000-8000-000000000001'
WHERE org_id IS NULL;

UPDATE public.data_issues di
SET org_id = COALESCE(
  (
    SELECT a.org_id
    FROM public.accounts a
    WHERE a.id = di.account_id
  ),
  '00000000-0000-4000-8000-000000000001'
)
WHERE di.org_id IS NULL;

UPDATE public.audit_trail at
SET org_id = COALESCE(
  (
    SELECT s.org_id
    FROM public.signals s
    WHERE s.id = at.signal_id
  ),
  '00000000-0000-4000-8000-000000000001'
)
WHERE at.org_id IS NULL;

ALTER TABLE public.accounts
  ALTER COLUMN org_id SET NOT NULL,
  ADD CONSTRAINT accounts_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.signals
  ALTER COLUMN org_id SET NOT NULL,
  ADD CONSTRAINT signals_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.data_issues
  ALTER COLUMN org_id SET NOT NULL,
  ADD CONSTRAINT data_issues_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.audit_trail
  ALTER COLUMN org_id SET NOT NULL,
  ADD CONSTRAINT audit_trail_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS accounts_org_id_idx ON public.accounts (org_id);
CREATE INDEX IF NOT EXISTS signals_org_id_created_at_idx ON public.signals (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS signals_org_id_account_name_idx ON public.signals (org_id, account_name);
CREATE INDEX IF NOT EXISTS data_issues_org_id_account_status_idx ON public.data_issues (org_id, account_id, status);
CREATE INDEX IF NOT EXISTS audit_trail_org_id_created_at_idx ON public.audit_trail (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_org_id_idx ON public.profiles (org_id);
CREATE INDEX IF NOT EXISTS organization_members_user_id_idx ON public.organization_members (user_id);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read accounts" ON public.accounts;
DROP POLICY IF EXISTS "public update accounts" ON public.accounts;
DROP POLICY IF EXISTS "public read signals" ON public.signals;
DROP POLICY IF EXISTS "public update signals" ON public.signals;
DROP POLICY IF EXISTS "public read data_issues" ON public.data_issues;
DROP POLICY IF EXISTS "public insert data_issues" ON public.data_issues;
DROP POLICY IF EXISTS "public update data_issues" ON public.data_issues;
DROP POLICY IF EXISTS "public delete data_issues" ON public.data_issues;
DROP POLICY IF EXISTS "public read audit_trail" ON public.audit_trail;
DROP POLICY IF EXISTS "public insert audit_trail" ON public.audit_trail;

CREATE POLICY "members can read organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = organizations.id
      AND m.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "admins can update organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = organizations.id
      AND m.user_id = (SELECT auth.uid())
      AND m.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = organizations.id
      AND m.user_id = (SELECT auth.uid())
      AND m.role = 'admin'
  )
);

CREATE POLICY "users can read their profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = (SELECT auth.uid()));

CREATE POLICY "users can update their profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "users can read their memberships"
ON public.organization_members
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "members can read accounts"
ON public.accounts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = accounts.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "members can insert accounts"
ON public.accounts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = accounts.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "members can update accounts"
ON public.accounts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = accounts.org_id
      AND m.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = accounts.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "members can read signals"
ON public.signals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = signals.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "members can insert signals"
ON public.signals
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = signals.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "members can update signals"
ON public.signals
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = signals.org_id
      AND m.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = signals.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "members can read data issues"
ON public.data_issues
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = data_issues.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "members can insert data issues"
ON public.data_issues
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = data_issues.org_id
      AND m.user_id = (SELECT auth.uid())
  )
  AND EXISTS (
    SELECT 1
    FROM public.accounts a
    WHERE a.id = data_issues.account_id
      AND a.org_id = data_issues.org_id
  )
);

CREATE POLICY "members can update data issues"
ON public.data_issues
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = data_issues.org_id
      AND m.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = data_issues.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "members can delete data issues"
ON public.data_issues
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = data_issues.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "members can read audit trail"
ON public.audit_trail
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = audit_trail.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "members can insert audit trail"
ON public.audit_trail
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = audit_trail.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.create_data_issue(
  account_id uuid,
  field_name text,
  issue_type text,
  severity text,
  suggested_fix text
)
RETURNS TABLE(issue_id uuid, data_quality_score integer)
LANGUAGE plpgsql
AS $$
DECLARE
  p_account_id ALIAS FOR $1;
  p_field_name ALIAS FOR $2;
  p_issue_type ALIAS FOR $3;
  p_severity ALIAS FOR $4;
  p_suggested_fix ALIAS FOR $5;
  v_score_impact integer;
  v_org_id uuid;
BEGIN
  IF p_issue_type NOT IN ('missing', 'stale', 'invalid') THEN
    RAISE EXCEPTION 'Invalid issue_type: %', p_issue_type
      USING ERRCODE = '23514';
  END IF;

  v_score_impact := CASE p_severity
    WHEN 'high' THEN 8
    WHEN 'medium' THEN 5
    WHEN 'low' THEN 2
    ELSE NULL
  END;

  IF v_score_impact IS NULL THEN
    RAISE EXCEPTION 'Invalid severity: %', p_severity
      USING ERRCODE = '23514';
  END IF;

  SELECT a.org_id
  INTO v_org_id
  FROM public.accounts a
  WHERE a.id = p_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found: %', p_account_id
      USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.data_issues (
    org_id,
    account_id,
    field_name,
    issue_type,
    severity,
    suggested_fix,
    status,
    score_impact
  )
  VALUES (
    v_org_id,
    p_account_id,
    p_field_name,
    p_issue_type,
    p_severity,
    p_suggested_fix,
    'open',
    v_score_impact
  )
  RETURNING id INTO issue_id;

  UPDATE public.accounts a
  SET data_quality_score = GREATEST(
    0,
    LEAST(100, COALESCE(a.data_quality_score, 0) - v_score_impact)
  )
  WHERE a.id = p_account_id
  RETURNING a.data_quality_score INTO data_quality_score;

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_data_issue(issue_id uuid)
RETURNS TABLE(account_id uuid, data_quality_score integer)
LANGUAGE plpgsql
AS $$
DECLARE
  p_issue_id ALIAS FOR $1;
  v_issue record;
  v_account_name text;
  v_current_score integer;
BEGIN
  SELECT
    di.id,
    di.org_id,
    di.account_id,
    di.status,
    COALESCE(di.score_impact, 0) AS score_impact,
    di.suggested_fix
  INTO v_issue
  FROM public.data_issues di
  WHERE di.id = p_issue_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data issue not found: %', p_issue_id
      USING ERRCODE = 'P0002';
  END IF;

  SELECT a.name, a.data_quality_score
  INTO v_account_name, v_current_score
  FROM public.accounts a
  WHERE a.id = v_issue.account_id
    AND a.org_id = v_issue.org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found for data issue: %', p_issue_id
      USING ERRCODE = 'P0002';
  END IF;

  account_id := v_issue.account_id;

  IF v_issue.status <> 'open' THEN
    data_quality_score := v_current_score;
    RETURN NEXT;
    RETURN;
  END IF;

  UPDATE public.data_issues di
  SET status = 'resolved',
      resolved_at = now()
  WHERE di.id = v_issue.id;

  UPDATE public.accounts a
  SET data_quality_score = GREATEST(
    0,
    LEAST(100, COALESCE(a.data_quality_score, 0) + v_issue.score_impact)
  )
  WHERE a.id = v_issue.account_id
    AND a.org_id = v_issue.org_id
  RETURNING a.data_quality_score INTO data_quality_score;

  INSERT INTO public.audit_trail (
    org_id,
    signal_id,
    account_name,
    action,
    reasoning
  )
  VALUES (
    v_issue.org_id,
    NULL,
    v_account_name,
    'gap_resolved',
    v_issue.suggested_fix
  );

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.dismiss_data_issue(issue_id uuid)
RETURNS TABLE(account_id uuid, data_quality_score integer)
LANGUAGE plpgsql
AS $$
DECLARE
  p_issue_id ALIAS FOR $1;
  v_issue record;
  v_account_name text;
  v_current_score integer;
BEGIN
  SELECT
    di.id,
    di.org_id,
    di.account_id,
    di.status,
    di.suggested_fix
  INTO v_issue
  FROM public.data_issues di
  WHERE di.id = p_issue_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data issue not found: %', p_issue_id
      USING ERRCODE = 'P0002';
  END IF;

  SELECT a.name, a.data_quality_score
  INTO v_account_name, v_current_score
  FROM public.accounts a
  WHERE a.id = v_issue.account_id
    AND a.org_id = v_issue.org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found for data issue: %', p_issue_id
      USING ERRCODE = 'P0002';
  END IF;

  account_id := v_issue.account_id;
  data_quality_score := v_current_score;

  IF v_issue.status <> 'open' THEN
    RETURN NEXT;
    RETURN;
  END IF;

  UPDATE public.data_issues di
  SET status = 'dismissed',
      resolved_at = now()
  WHERE di.id = v_issue.id;

  INSERT INTO public.audit_trail (
    org_id,
    signal_id,
    account_name,
    action,
    reasoning
  )
  VALUES (
    v_issue.org_id,
    NULL,
    v_account_name,
    'gap_dismissed',
    v_issue.suggested_fix
  );

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_all_open_issues(account_id uuid)
RETURNS TABLE(data_quality_score integer, resolved_issue_count integer)
LANGUAGE plpgsql
AS $$
DECLARE
  p_account_id ALIAS FOR $1;
  v_issue_ids uuid[];
  v_account_name text;
  v_org_id uuid;
  v_current_score integer;
  v_total_impact integer;
  v_resolved_at timestamptz := now();
BEGIN
  SELECT a.name, a.org_id, a.data_quality_score
  INTO v_account_name, v_org_id, v_current_score
  FROM public.accounts a
  WHERE a.id = p_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found: %', p_account_id
      USING ERRCODE = 'P0002';
  END IF;

  SELECT
    COALESCE(ARRAY_AGG(locked_issues.id), ARRAY[]::uuid[]),
    COALESCE(SUM(COALESCE(locked_issues.score_impact, 0)), 0)::integer,
    COUNT(*)::integer
  INTO v_issue_ids, v_total_impact, resolved_issue_count
  FROM (
    SELECT di.id, di.score_impact
    FROM public.data_issues di
    WHERE di.account_id = p_account_id
      AND di.org_id = v_org_id
      AND di.status = 'open'
    FOR UPDATE
  ) AS locked_issues;

  IF resolved_issue_count = 0 THEN
    data_quality_score := v_current_score;
    RETURN NEXT;
    RETURN;
  END IF;

  WITH resolved AS (
    UPDATE public.data_issues di
    SET status = 'resolved',
        resolved_at = v_resolved_at
    WHERE di.id = ANY(v_issue_ids)
    RETURNING di.suggested_fix
  )
  INSERT INTO public.audit_trail (
    org_id,
    signal_id,
    account_name,
    action,
    reasoning
  )
  SELECT
    v_org_id,
    NULL,
    v_account_name,
    'gap_resolved',
    resolved.suggested_fix
  FROM resolved;

  UPDATE public.accounts a
  SET data_quality_score = GREATEST(
    0,
    LEAST(100, COALESCE(a.data_quality_score, 0) + v_total_impact)
  )
  WHERE a.id = p_account_id
    AND a.org_id = v_org_id
  RETURNING a.data_quality_score INTO data_quality_score;

  RETURN NEXT;
END;
$$;
