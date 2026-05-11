
DELETE FROM signals;
DELETE FROM accounts;

INSERT INTO accounts (name, domain, industry, employee_count, data_quality_score, icp_fit_score) VALUES
('Stripe',      'stripe.com',      'Payments',           8000, 96, 95),
('Figma',       'figma.com',       'Design',             1500, 95, 94),
('Notion',      'notion.so',       'Productivity',        700, 94, 92),
('Vercel',      'vercel.com',      'DevTools',            600, 93, 91),
('Linear',      'linear.app',      'Productivity',        200, 92, 93),
('HubSpot',     'hubspot.com',     'CRM',                8500, 91, 88),
('Intercom',    'intercom.com',    'Customer Support',   1100, 90, 87),
('Amplitude',   'amplitude.com',   'Analytics',           800, 89, 86),
('Mixpanel',    'mixpanel.com',    'Analytics',           400, 88, 84),
('Airtable',    'airtable.com',    'Productivity',        900, 87, 85),
('Retool',      'retool.com',      'DevTools',            500, 86, 83),
('Loom',        'loom.com',        'Video',               350, 85, 81),
('Lattice',     'lattice.com',     'HR Tech',             600, 84, 80),
('Contentful',  'contentful.com',  'CMS',                 750, 83, 78),
('Brex',        'brex.com',        'Fintech',            1200, 82, 82),
('Carta',       'carta.com',       'Fintech',            1800, 81, 79),
('Deel',        'deel.com',        'HR Tech',            3500, 79, 86),
('Rippling',    'rippling.com',    'HR Tech',            3000, 78, 85),
('Make',        'make.com',        'Automation',          400, 76, 77),
('ElevenLabs',  'elevenlabs.io',   'AI/Voice',            150, 73, 90),
('Cursor',      'cursor.com',      'AI/DevTools',          80, 71, 92),
('Lovable',     'lovable.dev',     'AI/DevTools',         100, 68, 94);

INSERT INTO signals (account_name, source, status, velocity_score, why_now, assigned_to, playbook) VALUES
('Stripe',     'New CFO + earnings beat',           'approved', 94, 'Finance leadership change',         'A. Romero', 'Expansion play'),
('Figma',      'Config 2026 announcement',          'approved', 91, 'Major product event window',        'J. Chen',   'Event play'),
('Linear',     'Series C $80M raised',              'approved', 93, 'Funding round closed',              'M. Patel',  'Expansion play'),
('Vercel',     'Next.js 16 release + hiring surge', 'approved', 90, 'Launch + RevOps hiring',            'J. Chen',   'Launch play'),
('Cursor',     '5 AE hires + ARR milestone',        'held',     92, 'Aggressive GTM ramp',               'AE Pool',   NULL),
('Lovable',    'Stack migration off Vercel',        'held',     89, 'Infrastructure shift detected',     'AE Pool',   NULL),
('ElevenLabs', 'Enterprise tier launch',            'held',     88, 'New ICP segment, low data trust',   NULL,        NULL),
('Deel',       'Layoff signal + churn risk',        'held',     65, 'Negative signals exceed threshold', NULL,        NULL);
