-- CraftID minimal schema (no Supabase Auth required)

create extension if not exists "pgcrypto";

create table if not exists public.artisans (
  slug text primary key,
  full_name text,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.artisans enable row level security;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  artisan_slug text not null references public.artisans (slug) on delete cascade,
  txn_ref text not null unique,
  payment_reference text,
  amount_kobo bigint not null,
  client_name text,
  purpose text,
  status text not null default 'completed',
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  artisan_slug text not null references public.artisans (slug) on delete cascade,
  reference text not null unique,
  amount_kobo bigint not null,
  customer_name text,
  customer_email text,
  description text,
  address text,
  due_at timestamptz,
  status text not null default 'created',
  provider text not null default 'interswitch',
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

create index if not exists invoices_artisan_created_at_idx
  on public.invoices (artisan_slug, created_at desc);

create index if not exists payments_artisan_paid_at_idx
  on public.payments (artisan_slug, paid_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists artisans_set_updated_at on public.artisans;
create trigger artisans_set_updated_at
before update on public.artisans
for each row execute function public.set_updated_at();

create or replace function public.get_payment_stats(p_slug text)
returns table(payment_count bigint, volume_kobo bigint)
language sql
stable
as $$
  select
    count(*)::bigint as payment_count,
    coalesce(sum(amount_kobo), 0)::bigint as volume_kobo
  from public.payments
  where artisan_slug = p_slug
    and status = 'completed';
$$;
