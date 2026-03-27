-- CraftID demo seed data
-- Inserts 1 artisan (Favour Olaleru), 3 unpaid invoices, and 20 completed payments.
--
-- How to use:
-- 1) Open Supabase Dashboard → SQL Editor
-- 2) Paste this file and run
--
-- Notes:
-- - The app identifies the artisan by slug: "favour-olaleru" (derived from "Favour Olaleru").
-- - Payments must have status='completed' to count toward dashboard stats.

begin;

-- 1) Demo artisan
insert into public.artisans (slug, full_name, profile)
values (
  'favour-olaleru',
  'Favour Olaleru',
  jsonb_build_object(
    'firstName', 'Favour',
    'fullName', 'Favour Olaleru',
    'email', 'favour@craftid.ng',
    'phone', '',
    'state', 'Lagos',
    'skill', '⚡ Welder',
    'experience', 6,
    'minJob', '15,000',
    'avgJob', '35,000',
    'premiumJob', '120,000',
    'bio', 'Skilled artisan delivering reliable work with transparent invoicing and verified payment history.',
    'bvn', '',
    'nin', '',
    'bvnVerified', false,
    'bvnName', '',
    'slug', 'favour-olaleru',
    'paymentLink', '/pay/favour-olaleru',
    'createdAt', to_char(now() - interval '120 days', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  )
)
on conflict (slug)
do update set
  full_name = excluded.full_name,
  profile = excluded.profile;

-- 2) Unpaid invoices (3)
insert into public.invoices (
  artisan_slug,
  reference,
  amount_kobo,
  customer_name,
  customer_email,
  description,
  address,
  due_at,
  status,
  provider,
  provider_payload,
  created_at
)
values
  (
    'favour-olaleru',
    'INV-00001001',
    2500000,
    'Chidinma Okeke',
    'chidinma.client@example.com',
    'Metal gate repair (materials + labour)',
    'Surulere, Lagos',
    now() + interval '5 days',
    'created',
    'internal',
    jsonb_build_object('source', 'seed', 'note', 'Demo unpaid invoice'),
    now() - interval '8 days'
  ),
  (
    'favour-olaleru',
    'INV-00001002',
    4500000,
    'Tunde Adebayo',
    'tunde.client@example.com',
    'Fabrication of balcony railings (phase 1)',
    'Yaba, Lagos',
    now() + interval '10 days',
    'created',
    'internal',
    jsonb_build_object('source', 'seed', 'note', 'Demo unpaid invoice'),
    now() - interval '6 days'
  ),
  (
    'favour-olaleru',
    'INV-00001003',
    1200000,
    'Aisha Bello',
    'aisha.client@example.com',
    'Welding fix: door hinges + reinforcement',
    'Ikeja, Lagos',
    now() + interval '3 days',
    'created',
    'internal',
    jsonb_build_object('source', 'seed', 'note', 'Demo unpaid invoice'),
    now() - interval '3 days'
  )
on conflict (reference)
do update set
  artisan_slug = excluded.artisan_slug,
  amount_kobo = excluded.amount_kobo,
  customer_name = excluded.customer_name,
  customer_email = excluded.customer_email,
  description = excluded.description,
  address = excluded.address,
  due_at = excluded.due_at,
  status = excluded.status,
  provider = excluded.provider,
  provider_payload = excluded.provider_payload;

-- 3) Completed payments (20)
-- txn_ref must be unique.
insert into public.payments (
  artisan_slug,
  txn_ref,
  payment_reference,
  amount_kobo,
  client_name,
  purpose,
  status,
  paid_at,
  created_at
)
values
  ('favour-olaleru', 'demo_favour_001', 'ISW-DEMO-001', 1500000,  'Chinedu',   'Minor welding fix (hinge alignment)',              'completed', now() - interval '46 days', now() - interval '46 days'),
  ('favour-olaleru', 'demo_favour_002', 'ISW-DEMO-002', 3500000,  'Amina',     'Window burglary proof reinforcement',             'completed', now() - interval '44 days', now() - interval '44 days'),
  ('favour-olaleru', 'demo_favour_003', 'ISW-DEMO-003', 8000000,  'Kunle',     'Fabrication: steel door frame',                    'completed', now() - interval '42 days', now() - interval '42 days'),
  ('favour-olaleru', 'demo_favour_004', 'ISW-DEMO-004', 12000000, 'Ifeoma',    'Gate welding and repaint touch-up',                'completed', now() - interval '40 days', now() - interval '40 days'),
  ('favour-olaleru', 'demo_favour_005', 'ISW-DEMO-005', 2500000,  'Seyi',      'On-site assessment and measurements',              'completed', now() - interval '38 days', now() - interval '38 days'),
  ('favour-olaleru', 'demo_favour_006', 'ISW-DEMO-006', 6000000,  'Bola',      'Stainless handrail welding (small section)',       'completed', now() - interval '36 days', now() - interval '36 days'),
  ('favour-olaleru', 'demo_favour_007', 'ISW-DEMO-007', 20000000, 'Tunde',     'Balcony railings (deposit)',                       'completed', now() - interval '34 days', now() - interval '34 days'),
  ('favour-olaleru', 'demo_favour_008', 'ISW-DEMO-008', 4500000,  'Aisha',     'Door reinforcement bars',                           'completed', now() - interval '32 days', now() - interval '32 days'),
  ('favour-olaleru', 'demo_favour_009', 'ISW-DEMO-009', 9500000,  'Ngozi',     'Metal shelf fabrication',                           'completed', now() - interval '30 days', now() - interval '30 days'),
  ('favour-olaleru', 'demo_favour_010', 'ISW-DEMO-010', 3000000,  'Emeka',     'Welding repairs: leaking tank bracket',            'completed', now() - interval '28 days', now() - interval '28 days'),
  ('favour-olaleru', 'demo_favour_011', 'ISW-DEMO-011', 7500000,  'Fatima',    'Security grilles installation (labour)',           'completed', now() - interval '26 days', now() - interval '26 days'),
  ('favour-olaleru', 'demo_favour_012', 'ISW-DEMO-012', 18000000, 'Chidinma',  'Gate repair + replacement of lock casing',         'completed', now() - interval '24 days', now() - interval '24 days'),
  ('favour-olaleru', 'demo_favour_013', 'ISW-DEMO-013', 5000000,  'Musa',      'Welding: staircase support bracket',               'completed', now() - interval '22 days', now() - interval '22 days'),
  ('favour-olaleru', 'demo_favour_014', 'ISW-DEMO-014', 22000000, 'Tolu',      'Fabrication: custom steel gate (phase 1)',         'completed', now() - interval '20 days', now() - interval '20 days'),
  ('favour-olaleru', 'demo_favour_015', 'ISW-DEMO-015', 4000000,  'Ada',       'Minor welding: window frame alignment',            'completed', now() - interval '18 days', now() - interval '18 days'),
  ('favour-olaleru', 'demo_favour_016', 'ISW-DEMO-016', 11000000, 'Joseph',    'Metal door fabrication (labour)',                  'completed', now() - interval '16 days', now() - interval '16 days'),
  ('favour-olaleru', 'demo_favour_017', 'ISW-DEMO-017', 6500000,  'Zainab',    'Handrail welding + finishing',                     'completed', now() - interval '14 days', now() - interval '14 days'),
  ('favour-olaleru', 'demo_favour_018', 'ISW-DEMO-018', 9000000,  'Samuel',    'Steel rack reinforcement and welding fixes',       'completed', now() - interval '12 days', now() - interval '12 days'),
  ('favour-olaleru', 'demo_favour_019', 'ISW-DEMO-019', 14000000, 'Bisi',      'Fabrication: protective cage (generator)',         'completed', now() - interval '10 days', now() - interval '10 days'),
  ('favour-olaleru', 'demo_favour_020', 'ISW-DEMO-020', 7000000,  'Ibrahim',   'Final welding + on-site installation support',     'completed', now() - interval '8 days',  now() - interval '8 days')
on conflict (txn_ref)
do update set
  artisan_slug = excluded.artisan_slug,
  payment_reference = excluded.payment_reference,
  amount_kobo = excluded.amount_kobo,
  client_name = excluded.client_name,
  purpose = excluded.purpose,
  status = excluded.status,
  paid_at = excluded.paid_at,
  created_at = excluded.created_at;

commit;
