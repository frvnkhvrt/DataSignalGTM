
ALTER TABLE public.signals
  ALTER COLUMN playbook TYPE jsonb USING NULL;

UPDATE public.signals SET playbook = jsonb_build_object(
  'role_target', 'VP of Revenue Operations',
  'rationale', 'Finance leadership change + earnings beat creates a rare expansion window. Composite score >90 with verified data trust.',
  'channels', ARRAY['LinkedIn','Email','Phone'],
  'steps', jsonb_build_array(
    jsonb_build_object('day',1,'channel','LinkedIn','action','Connect with new CFO','message_hint','Reference Q4 beat + RevOps modernization'),
    jsonb_build_object('day',2,'channel','Email','action','Send tailored intro','message_hint','Lead with peer benchmark in Payments vertical'),
    jsonb_build_object('day',4,'channel','Phone','action','Discovery call','message_hint','Anchor on RevOps tech stack consolidation'),
    jsonb_build_object('day',7,'channel','Email','action','Follow-up + case study','message_hint','Share Stripe-comparable customer story')
  )
) WHERE account_name = 'Stripe';

UPDATE public.signals SET playbook = jsonb_build_object(
  'role_target', 'Director of Revenue',
  'rationale', 'Config 2026 announcement signals expansion intent. Strong ICP fit + high data trust.',
  'channels', ARRAY['LinkedIn','Email'],
  'steps', jsonb_build_array(
    jsonb_build_object('day',1,'channel','LinkedIn','action','Engage on Config post','message_hint','Comment with relevant insight'),
    jsonb_build_object('day',2,'channel','Email','action','Event-tied intro','message_hint','Tie message to Config keynote themes'),
    jsonb_build_object('day',5,'channel','LinkedIn','action','Direct message','message_hint','Offer 15-min Config debrief'),
    jsonb_build_object('day',8,'channel','Email','action','Value follow-up','message_hint','Share design-ops benchmark report')
  )
) WHERE account_name = 'Figma';

UPDATE public.signals SET playbook = jsonb_build_object(
  'role_target', 'VP of Sales',
  'rationale', 'Series C closed last week. Hiring and tooling budget unlocked — classic expansion trigger.',
  'channels', ARRAY['Email','LinkedIn','Phone'],
  'steps', jsonb_build_array(
    jsonb_build_object('day',1,'channel','Email','action','Congrats + value frame','message_hint','Reference $80M raise; tie to scaling pain'),
    jsonb_build_object('day',3,'channel','LinkedIn','action','Add VP of Sales','message_hint','Share post-Series-C playbook'),
    jsonb_build_object('day',5,'channel','Phone','action','Discovery call','message_hint','Focus on team scaling and pipeline ops'),
    jsonb_build_object('day',9,'channel','Email','action','Bring in exec sponsor','message_hint','Loop in CRO for peer-level outreach')
  )
) WHERE account_name = 'Linear';

UPDATE public.signals SET playbook = jsonb_build_object(
  'role_target', 'Head of Developer Relations',
  'rationale', 'Next.js 16 launch + RevOps hiring surge. Buying committee actively forming.',
  'channels', ARRAY['LinkedIn','Email'],
  'steps', jsonb_build_array(
    jsonb_build_object('day',1,'channel','LinkedIn','action','Engage on launch post','message_hint','Highlight a specific Next.js 16 capability'),
    jsonb_build_object('day',2,'channel','Email','action','Tailored intro','message_hint','Anchor on DevRel + RevOps overlap'),
    jsonb_build_object('day',4,'channel','Email','action','Send case study','message_hint','Share metrics from a comparable platform'),
    jsonb_build_object('day',7,'channel','LinkedIn','action','Voice memo','message_hint','30-second personalized video note')
  )
) WHERE account_name = 'Vercel';

ALTER TABLE public.signals  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals  ENABLE  ROW LEVEL SECURITY;
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public update signals"  ON public.signals;
DROP POLICY IF EXISTS "public update accounts" ON public.accounts;

CREATE POLICY "public update signals"  ON public.signals  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public update accounts" ON public.accounts FOR UPDATE USING (true) WITH CHECK (true);
