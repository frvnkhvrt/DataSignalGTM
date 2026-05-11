-- Hardening pass v2: status column, issue_type check, RLS, seed for live accounts

-- 1. Add status column (open | resolved | dismissed)
ALTER TABLE public.data_issues
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open';

ALTER TABLE public.data_issues
  DROP CONSTRAINT IF EXISTS data_issues_status_check;
ALTER TABLE public.data_issues
  ADD CONSTRAINT data_issues_status_check
  CHECK (status IN ('open', 'resolved', 'dismissed'));

-- 2. Replace issue_type check (old: empty/stale/duplicate/contradiction -> new: missing/stale/invalid)
ALTER TABLE public.data_issues
  DROP CONSTRAINT IF EXISTS data_issues_issue_type_check;
ALTER TABLE public.data_issues
  ADD CONSTRAINT data_issues_issue_type_check
  CHECK (issue_type IN ('missing', 'stale', 'invalid'));

-- 3. RLS policies for data_issues
ALTER TABLE public.data_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read data_issues"   ON public.data_issues;
DROP POLICY IF EXISTS "public insert data_issues" ON public.data_issues;
DROP POLICY IF EXISTS "public update data_issues" ON public.data_issues;
DROP POLICY IF EXISTS "public delete data_issues" ON public.data_issues;

CREATE POLICY "public read data_issues"   ON public.data_issues FOR SELECT USING (true);
CREATE POLICY "public insert data_issues" ON public.data_issues FOR INSERT WITH CHECK (true);
CREATE POLICY "public update data_issues" ON public.data_issues FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete data_issues" ON public.data_issues FOR DELETE USING (true);

-- 4. RLS policies for audit_trail
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read audit_trail"   ON public.audit_trail;
DROP POLICY IF EXISTS "public insert audit_trail" ON public.audit_trail;

CREATE POLICY "public read audit_trail"   ON public.audit_trail FOR SELECT USING (true);
CREATE POLICY "public insert audit_trail" ON public.audit_trail FOR INSERT WITH CHECK (true);

-- 5. Seed data_issues for accounts with DQ < 90 (idempotent: clear open rows first)
DELETE FROM public.data_issues WHERE status = 'open';

INSERT INTO public.data_issues (account_id, field_name, issue_type, severity, suggested_fix, status)
SELECT a.id, d.field_name, d.issue_type, d.severity, d.suggested_fix, 'open'
FROM (VALUES
  -- Ramp (DQ 89)
  ('Ramp', 'Phone',          'missing', 'high',   'Enrich direct-dial via Apollo or ZoomInfo for champion contacts'),
  ('Ramp', 'Last contacted', 'stale',   'medium', 'No contact logged in 60+ days — trigger re-engagement check'),
  ('Ramp', 'LinkedIn URL',   'missing', 'low',    'Add LinkedIn company URL to improve channel routing accuracy'),

  -- Notion (DQ 87)
  ('Notion', 'Job Title',      'missing', 'high',   'Missing job title for key contacts — blocks persona scoring'),
  ('Notion', 'LinkedIn URL',   'missing', 'high',   'Add LinkedIn URL to enable social-channel sequencing'),
  ('Notion', 'Last contacted', 'stale',   'medium', 'Last touch >90 days — verify relationship is still warm'),
  ('Notion', 'Phone',          'missing', 'low',    'No direct phone on file — limits phone step in sequences'),

  -- Retool (DQ 84)
  ('Retool', 'Phone',        'missing', 'high',   'No direct-dial on record — enrich via ZoomInfo or Cognism'),
  ('Retool', 'Job Title',    'stale',   'medium', 'Job title data >6 months old — re-verify role and level'),
  ('Retool', 'LinkedIn URL', 'invalid', 'medium', 'LinkedIn URL returns 404 — update to current profile'),
  ('Retool', 'Email',        'stale',   'low',    'Email last validated over 8 months ago — re-verify deliverability'),

  -- Webflow (DQ 78)
  ('Webflow', 'Phone',          'missing', 'high',   'Direct phone absent — enrich via Apollo before phone step'),
  ('Webflow', 'LinkedIn URL',   'missing', 'high',   'No LinkedIn URL — required for LinkedIn channel actions'),
  ('Webflow', 'Job Title',      'stale',   'medium', 'Job title not updated since hire — confirm current role'),
  ('Webflow', 'Last contacted', 'stale',   'medium', 'Last touch 4 months ago — flag for re-engagement'),

  -- Miro (DQ 74)
  ('Miro', 'Phone',          'missing', 'high',   'No direct-dial — add before scheduling phone discovery step'),
  ('Miro', 'Job Title',      'missing', 'high',   'Champion contact has no title — blocks ICP persona match'),
  ('Miro', 'LinkedIn URL',   'invalid', 'medium', 'Stored LinkedIn URL does not resolve — replace with current'),
  ('Miro', 'Last contacted', 'stale',   'medium', 'No outreach logged in 75 days — re-engage or mark inactive'),

  -- Asana (DQ 68)
  ('Asana', 'Phone',          'missing', 'high',   'No phone on file — enrich all contacts via Apollo before outreach'),
  ('Asana', 'Job Title',      'missing', 'high',   'Missing titles on 3 of 4 contacts — required for persona scoring'),
  ('Asana', 'LinkedIn URL',   'missing', 'high',   'LinkedIn URL absent — LinkedIn channel steps will be skipped'),
  ('Asana', 'Last contacted', 'stale',   'medium', 'Last contact logged 110 days ago — validate account still active')
) AS d(account_name, field_name, issue_type, severity, suggested_fix)
JOIN public.accounts a ON a.name = d.account_name;
