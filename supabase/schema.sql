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
  destination text not null,
  destination_city text,
  destination_country text,
  days_count int not null default 0,
  style text,
  budget_tier text,
  travelers int,
  start_date date,
  end_date date,
  share_token uuid not null default gen_random_uuid(),
  itinerary jsonb not null,
  source text not null default 'generated',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists itineraries_share_token_idx on public.itineraries(share_token);
create index if not exists itineraries_user_id_created_at_idx on public.itineraries(user_id, created_at desc);

create table if not exists public.itinerary_versions (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  label text not null,
  itinerary jsonb not null,
  created_at timestamptz default now()
);

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
alter table public.newsletter_subscribers enable row level security;
alter table public.custom_requests enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "itineraries_select_own_or_shared" on public.itineraries;
create policy "itineraries_select_own_or_shared" on public.itineraries for select using (user_id is null or auth.uid() = user_id);
drop policy if exists "itineraries_insert_own" on public.itineraries;
create policy "itineraries_insert_own" on public.itineraries for insert with check (user_id is null or auth.uid() = user_id);
drop policy if exists "itineraries_update_own" on public.itineraries;
create policy "itineraries_update_own" on public.itineraries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "versions_select_own" on public.itinerary_versions;
create policy "versions_select_own" on public.itinerary_versions for select using (user_id is null or auth.uid() = user_id);
drop policy if exists "versions_insert_own" on public.itinerary_versions;
create policy "versions_insert_own" on public.itinerary_versions for insert with check (user_id is null or auth.uid() = user_id);

drop policy if exists "newsletter_insert_anyone" on public.newsletter_subscribers;
create policy "newsletter_insert_anyone" on public.newsletter_subscribers for insert with check (true);

drop policy if exists "custom_requests_insert_anyone" on public.custom_requests;
create policy "custom_requests_insert_anyone" on public.custom_requests for insert with check (true);
drop policy if exists "custom_requests_select_own" on public.custom_requests;
create policy "custom_requests_select_own" on public.custom_requests for select using (auth.uid() = user_id);
