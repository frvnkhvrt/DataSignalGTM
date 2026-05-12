-- Replace DQ gap scoring RPCs with explicit parameter aliases.
-- The initial migration used block-label-qualified parameters, which are not
-- valid in PL/pgSQL expressions on the target Supabase Postgres version.

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

  PERFORM 1
  FROM public.accounts a
  WHERE a.id = p_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found: %', p_account_id
      USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.data_issues (
    account_id,
    field_name,
    issue_type,
    severity,
    suggested_fix,
    status,
    score_impact
  )
  VALUES (
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
  RETURNING a.data_quality_score INTO data_quality_score;

  INSERT INTO public.audit_trail (
    signal_id,
    account_name,
    action,
    reasoning
  )
  VALUES (
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
    signal_id,
    account_name,
    action,
    reasoning
  )
  VALUES (
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
  v_current_score integer;
  v_total_impact integer;
  v_resolved_at timestamptz := now();
BEGIN
  SELECT
    COALESCE(ARRAY_AGG(locked_issues.id), ARRAY[]::uuid[]),
    COALESCE(SUM(COALESCE(locked_issues.score_impact, 0)), 0)::integer,
    COUNT(*)::integer
  INTO v_issue_ids, v_total_impact, resolved_issue_count
  FROM (
    SELECT di.id, di.score_impact
    FROM public.data_issues di
    WHERE di.account_id = p_account_id
      AND di.status = 'open'
    FOR UPDATE
  ) AS locked_issues;

  SELECT a.name, a.data_quality_score
  INTO v_account_name, v_current_score
  FROM public.accounts a
  WHERE a.id = p_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found: %', p_account_id
      USING ERRCODE = 'P0002';
  END IF;

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
    signal_id,
    account_name,
    action,
    reasoning
  )
  SELECT
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
  RETURNING a.data_quality_score INTO data_quality_score;

  RETURN NEXT;
END;
$$;
