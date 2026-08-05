-- Andor baseline for clean Supabase/Postgres installs.
--
-- This migration intentionally creates only the legacy tables required by the
-- canonical authorization migration that follows it. It is default-deny: no
-- temporary public-write policies are installed between migrations.

begin;

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  bio text default '',
  interests text[] default array[]::text[],
  visited_countries text[] default array[]::text[],
  looking_for_buddy boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  owner_key text,
  destination text not null,
  destination_city text,
  destination_country text,
  days_count integer not null default 0,
  style text,
  budget_tier text,
  travelers integer,
  start_date date,
  end_date date,
  share_token uuid not null default gen_random_uuid(),
  itinerary jsonb not null,
  source text not null default 'generated',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists itineraries_share_token_idx
  on public.itineraries(share_token);
create index if not exists itineraries_user_id_created_at_idx
  on public.itineraries(user_id, created_at desc);

create table if not exists public.itinerary_versions (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  label text not null,
  itinerary jsonb not null,
  created_at timestamptz default now()
);

create table if not exists public.itinerary_shares (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  owner_key text not null,
  token_hash text not null unique,
  audience text not null check (audience in ('client', 'internal')),
  payload jsonb not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz
);

create index if not exists itinerary_shares_owner_source_idx
  on public.itinerary_shares(owner_key, source_key, created_at desc);
create index if not exists itinerary_shares_expiry_idx
  on public.itinerary_shares(expires_at)
  where revoked_at is null;

create table if not exists public.trip_ledgers (
  trip_key text not null,
  owner_key text not null,
  ledger jsonb not null default '{"participants":[],"expenses":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (trip_key, owner_key)
);

create index if not exists trip_ledgers_owner_updated_idx
  on public.trip_ledgers(owner_key, updated_at desc);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text default 'newsletter_popup',
  locale text default 'pt',
  status text not null default 'active',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.custom_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  budget numeric,
  travelers text,
  notes text,
  status text not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.itineraries enable row level security;
alter table public.itinerary_versions enable row level security;
alter table public.itinerary_shares enable row level security;
alter table public.trip_ledgers enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.custom_requests enable row level security;

revoke all on table
  public.profiles,
  public.itineraries,
  public.itinerary_versions,
  public.itinerary_shares,
  public.trip_ledgers,
  public.newsletter_subscribers,
  public.custom_requests
from anon, authenticated;

grant all on table
  public.profiles,
  public.itineraries,
  public.itinerary_versions,
  public.itinerary_shares,
  public.trip_ledgers,
  public.newsletter_subscribers,
  public.custom_requests
to service_role;

commit;
