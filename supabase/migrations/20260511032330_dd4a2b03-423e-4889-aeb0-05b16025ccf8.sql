
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  industry text,
  employee_count int,
  data_quality_score int not null default 0,
  icp_fit_score int not null default 0,
  created_at timestamptz not null default now()
);

create table public.signals (
  id uuid primary key default gen_random_uuid(),
  account_name text not null,
  source text,
  status text not null default 'held',
  velocity_score int not null default 0,
  why_now text,
  assigned_to text,
  playbook text,
  created_at timestamptz not null default now()
);

alter table public.accounts enable row level security;
alter table public.signals enable row level security;

create policy "public read accounts" on public.accounts for select using (true);
create policy "public read signals" on public.signals for select using (true);
