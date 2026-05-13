-- Keep the shared public demo read-only at the database boundary.
CREATE OR REPLACE FUNCTION public.is_demo_user()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_demo', 'false') = 'true'
    OR lower(COALESCE(auth.jwt() ->> 'email', '')) IN (
      'demo@datasignalgtm.com',
      'demo@datasignalgtm.local'
    );
$$;

DROP POLICY IF EXISTS "authenticated users can create organizations" ON public.organizations;
CREATE POLICY "authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (NOT public.is_demo_user());

DROP POLICY IF EXISTS "admins can update organizations" ON public.organizations;
CREATE POLICY "admins can update organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  NOT public.is_demo_user()
  AND EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = organizations.id
      AND m.user_id = (SELECT auth.uid())
      AND m.role = 'admin'
  )
)
WITH CHECK (
  NOT public.is_demo_user()
  AND EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = organizations.id
      AND m.user_id = (SELECT auth.uid())
      AND m.role = 'admin'
  )
);

DROP POLICY IF EXISTS "members can insert accounts" ON public.accounts;
CREATE POLICY "members can insert accounts"
ON public.accounts
FOR INSERT
TO authenticated
WITH CHECK (
  NOT public.is_demo_user()
  AND EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = accounts.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "members can update accounts" ON public.accounts;
CREATE POLICY "members can update accounts"
ON public.accounts
FOR UPDATE
TO authenticated
USING (
  NOT public.is_demo_user()
  AND EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = accounts.org_id
      AND m.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  NOT public.is_demo_user()
  AND EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = accounts.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "members can insert signals" ON public.signals;
CREATE POLICY "members can insert signals"
ON public.signals
FOR INSERT
TO authenticated
WITH CHECK (
  NOT public.is_demo_user()
  AND EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = signals.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "members can update signals" ON public.signals;
CREATE POLICY "members can update signals"
ON public.signals
FOR UPDATE
TO authenticated
USING (
  NOT public.is_demo_user()
  AND EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = signals.org_id
      AND m.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  NOT public.is_demo_user()
  AND EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = signals.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "members can insert data issues" ON public.data_issues;
CREATE POLICY "members can insert data issues"
ON public.data_issues
FOR INSERT
TO authenticated
WITH CHECK (
  NOT public.is_demo_user()
  AND EXISTS (
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

DROP POLICY IF EXISTS "members can update data issues" ON public.data_issues;
CREATE POLICY "members can update data issues"
ON public.data_issues
FOR UPDATE
TO authenticated
USING (
  NOT public.is_demo_user()
  AND EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = data_issues.org_id
      AND m.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  NOT public.is_demo_user()
  AND EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = data_issues.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "members can delete data issues" ON public.data_issues;
CREATE POLICY "members can delete data issues"
ON public.data_issues
FOR DELETE
TO authenticated
USING (
  NOT public.is_demo_user()
  AND EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = data_issues.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "members can insert audit trail" ON public.audit_trail;
CREATE POLICY "members can insert audit trail"
ON public.audit_trail
FOR INSERT
TO authenticated
WITH CHECK (
  NOT public.is_demo_user()
  AND EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.org_id = audit_trail.org_id
      AND m.user_id = (SELECT auth.uid())
  )
);
