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

-- Create the application profile even when email confirmation means signUp does
-- not return an authenticated session. OAuth and password users share this path.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles as existing (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Viajante'
    )
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(nullif(existing.name, ''), excluded.name),
      updated_at = now();
  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create table if not exists public.itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  owner_key text,
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

alter table public.itineraries add column if not exists owner_key text;
update public.itineraries
set owner_key = 'supabase:' || user_id::text
where owner_key is null and user_id is not null;

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
  on public.itinerary_shares(expires_at) where revoked_at is null;

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

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "itineraries_select_own_or_shared" on public.itineraries;
drop policy if exists "itineraries_select_own" on public.itineraries;
create policy "itineraries_select_own" on public.itineraries for select using (auth.uid() = user_id);
drop policy if exists "itineraries_insert_own" on public.itineraries;
create policy "itineraries_insert_own" on public.itineraries for insert with check (auth.uid() = user_id);
drop policy if exists "itineraries_update_own" on public.itineraries;
create policy "itineraries_update_own" on public.itineraries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "versions_select_own" on public.itinerary_versions;
create policy "versions_select_own" on public.itinerary_versions for select using (auth.uid() = user_id);
drop policy if exists "versions_insert_own" on public.itinerary_versions;
create policy "versions_insert_own" on public.itinerary_versions for insert with check (auth.uid() = user_id);

drop policy if exists "newsletter_insert_anyone" on public.newsletter_subscribers;
create policy "newsletter_insert_anyone" on public.newsletter_subscribers for insert with check (true);

drop policy if exists "custom_requests_insert_anyone" on public.custom_requests;
create policy "custom_requests_insert_anyone" on public.custom_requests for insert with check (true);
drop policy if exists "custom_requests_select_own" on public.custom_requests;
create policy "custom_requests_select_own" on public.custom_requests for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Sprint 1 canonical schema
-- ---------------------------------------------------------------------------
-- This fresh-install snapshot applies the same canonicalization used by the
-- versioned upgrade below, so empty and existing databases converge without
-- maintaining a second copy of the security rules by hand.

-- Andor Sprint 1: canonical ownership, collaboration, durable imports and RLS.
--
-- This migration deliberately preserves the legacy `user_id`, `owner_key`,
-- `share_token`, `itinerary_shares` and text ledger keys. They are compatibility
-- data only after this migration; no RLS decision depends on them.

begin;

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Canonical itinerary columns and quarantine of ownerless legacy rows
-- ---------------------------------------------------------------------------

alter table public.itineraries
  add column if not exists owner_id uuid references auth.users(id) on delete restrict,
  add column if not exists visibility text not null default 'private',
  add column if not exists status text not null default 'active',
  add column if not exists currency text not null default 'EUR',
  add column if not exists schema_version integer not null default 1,
  add column if not exists version bigint not null default 1,
  add column if not exists deleted_at timestamptz,
  add column if not exists legacy_quarantined_at timestamptz;

update public.itineraries
set owner_id = user_id
where owner_id is null
  and user_id is not null;

update public.itineraries
set status = 'legacy_pending',
    visibility = 'private',
    legacy_quarantined_at = coalesce(legacy_quarantined_at, now())
where owner_id is null;

update public.itineraries
set user_id = owner_id,
    owner_key = 'supabase:' || owner_id::text,
    currency = upper(coalesce(nullif(trim(currency), ''), 'EUR')),
    schema_version = greatest(schema_version, 1),
    version = greatest(version, 1)
where owner_id is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'itineraries_visibility_check'
      and conrelid = 'public.itineraries'::regclass
  ) then
    alter table public.itineraries
      add constraint itineraries_visibility_check
      check (visibility in ('private', 'unlisted', 'public'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'itineraries_status_check'
      and conrelid = 'public.itineraries'::regclass
  ) then
    alter table public.itineraries
      add constraint itineraries_status_check
      check (status in ('draft', 'active', 'archived', 'deleted', 'legacy_pending'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'itineraries_currency_check'
      and conrelid = 'public.itineraries'::regclass
  ) then
    alter table public.itineraries
      add constraint itineraries_currency_check
      check (currency ~ '^[A-Z]{3}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'itineraries_schema_version_check'
      and conrelid = 'public.itineraries'::regclass
  ) then
    alter table public.itineraries
      add constraint itineraries_schema_version_check
      check (schema_version >= 1);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'itineraries_version_check'
      and conrelid = 'public.itineraries'::regclass
  ) then
    alter table public.itineraries
      add constraint itineraries_version_check
      check (version >= 1);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'itineraries_owner_state_check'
      and conrelid = 'public.itineraries'::regclass
  ) then
    alter table public.itineraries
      add constraint itineraries_owner_state_check
      check (
        (owner_id is null and status = 'legacy_pending' and legacy_quarantined_at is not null)
        or
        (owner_id is not null and status <> 'legacy_pending')
      );
  end if;
end
$$;

comment on column public.itineraries.owner_id is
  'Canonical owner. The server must derive this from auth.uid(); never from request JSON.';
comment on column public.itineraries.user_id is
  'Deprecated compatibility mirror of owner_id. Do not use for authorization.';
comment on column public.itineraries.owner_key is
  'Deprecated legacy identity key. Quarantined compatibility data; never an authorization source.';
comment on column public.itineraries.share_token is
  'Deprecated raw token. New links use trip_share_links.token_hash; do not expose this value.';
comment on column public.itineraries.version is
  'Optimistic concurrency version. Update with WHERE version = expected_version.';

create index if not exists itineraries_owner_updated_idx
  on public.itineraries(owner_id, updated_at desc)
  where owner_id is not null and deleted_at is null;
create index if not exists itineraries_legacy_quarantine_idx
  on public.itineraries(legacy_quarantined_at)
  where owner_id is null;

-- ---------------------------------------------------------------------------
-- Memberships, invitations, hashed share links, imports and audit
-- ---------------------------------------------------------------------------

create table if not exists public.trip_members (
  trip_id uuid not null references public.itineraries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  invited_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (trip_id, user_id),
  constraint trip_members_role_check check (role in ('owner', 'editor', 'viewer')),
  constraint trip_members_owner_active_check check (role <> 'owner' or revoked_at is null)
);

create index if not exists trip_members_user_active_idx
  on public.trip_members(user_id, updated_at desc)
  where revoked_at is null;

insert into public.trip_members (trip_id, user_id, role, invited_by, accepted_at)
select id, owner_id, 'owner', owner_id, coalesce(created_at, now())
from public.itineraries
where owner_id is not null
on conflict (trip_id, user_id) do update
set role = 'owner',
    revoked_at = null,
    updated_at = now();

create table if not exists public.trip_invitations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.itineraries(id) on delete cascade,
  email_hash text,
  role text not null,
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_invitations_role_check check (role in ('editor', 'viewer')),
  constraint trip_invitations_token_hash_check check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint trip_invitations_email_hash_check check (
    email_hash is null or email_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint trip_invitations_expiry_check check (expires_at > created_at),
  constraint trip_invitations_terminal_state_check check (
    not (accepted_at is not null and revoked_at is not null)
  )
);

create index if not exists trip_invitations_trip_created_idx
  on public.trip_invitations(trip_id, created_at desc);
create index if not exists trip_invitations_active_idx
  on public.trip_invitations(expires_at)
  where accepted_at is null and revoked_at is null;

create table if not exists public.trip_share_links (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.itineraries(id) on delete cascade,
  token_hash text not null unique,
  permission text not null default 'viewer',
  audience text not null default 'client',
  created_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  max_uses integer,
  use_count integer not null default 0,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_share_links_audience_check check (audience in ('client', 'internal')),
  constraint trip_share_links_permission_check check (permission = 'viewer'),
  constraint trip_share_links_token_hash_check check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint trip_share_links_expiry_check check (expires_at > created_at),
  constraint trip_share_links_max_uses_check check (max_uses is null or max_uses > 0),
  constraint trip_share_links_use_count_check check (use_count >= 0),
  constraint trip_share_links_use_limit_check check (max_uses is null or use_count <= max_uses)
);

create index if not exists trip_share_links_trip_created_idx
  on public.trip_share_links(trip_id, created_at desc);
create index if not exists trip_share_links_active_idx
  on public.trip_share_links(expires_at)
  where revoked_at is null;

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  trip_id uuid,
  action text not null,
  resource_type text not null,
  resource_id uuid not null,
  correlation_id text not null default gen_random_uuid()::text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_events_action_check check (action ~ '^[a-z][a-z0-9_.-]{2,79}$'),
  constraint audit_events_resource_type_check check (resource_type ~ '^[a-z][a-z0-9_.-]{1,39}$'),
  constraint audit_events_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index if not exists audit_events_trip_created_idx
  on public.audit_events(trip_id, created_at desc);
create index if not exists audit_events_actor_created_idx
  on public.audit_events(actor_user_id, created_at desc);

create table if not exists public.trip_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  local_id text,
  payload_hash text not null,
  trip_id uuid references public.itineraries(id) on delete set null,
  status text not null default 'pending',
  conflict_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint trip_imports_idempotency_key_check check (char_length(idempotency_key) between 8 and 200),
  constraint trip_imports_local_id_check check (
    local_id is null or char_length(local_id) between 1 and 200
  ),
  constraint trip_imports_payload_hash_check check (payload_hash ~ '^[0-9a-f]{64}$'),
  constraint trip_imports_status_check check (status in ('pending', 'completed', 'conflict', 'failed')),
  constraint trip_imports_completion_check check (
    (status = 'pending' and completed_at is null)
    or status <> 'pending'
  ),
  unique (user_id, idempotency_key)
);

create unique index if not exists trip_imports_user_local_hash_idx
  on public.trip_imports(user_id, local_id, payload_hash)
  where local_id is not null;
create index if not exists trip_imports_user_created_idx
  on public.trip_imports(user_id, created_at desc);

-- Legacy snapshots remain quarantined. New code must write trip_share_links.
alter table public.itinerary_shares
  add column if not exists legacy_quarantined_at timestamptz not null default now();
comment on table public.itinerary_shares is
  'Deprecated payload snapshots. Service-only quarantine; new links belong in trip_share_links.';

-- Canonicalize the existing ledger table without destroying text-keyed rows.
alter table public.trip_ledgers
  add column if not exists itinerary_id uuid references public.itineraries(id) on delete cascade,
  add column if not exists version bigint not null default 1,
  add column if not exists legacy_quarantined_at timestamptz;

with ledger_candidates as materialized (
  select ctid as row_id,
         case
           when trip_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             then trip_key::uuid
         end as trip_id
  from public.trip_ledgers
  where itinerary_id is null
)
update public.trip_ledgers ledger
set itinerary_id = candidate.trip_id
from ledger_candidates candidate
where ledger.ctid = candidate.row_id
  and candidate.trip_id is not null
  and exists (
    select 1 from public.itineraries itinerary
    where itinerary.id = candidate.trip_id
      and itinerary.owner_id is not null
      and ledger.owner_key = 'supabase:' || itinerary.owner_id::text
  );

update public.trip_ledgers
set legacy_quarantined_at = coalesce(legacy_quarantined_at, now())
where itinerary_id is null;

create unique index if not exists trip_ledgers_itinerary_idx
  on public.trip_ledgers(itinerary_id)
  where itinerary_id is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'trip_ledgers_version_check'
      and conrelid = 'public.trip_ledgers'::regclass
  ) then
    alter table public.trip_ledgers
      add constraint trip_ledgers_version_check check (version >= 1);
  end if;
end
$$;

comment on column public.trip_ledgers.trip_key is
  'Deprecated compatibility key. Canonical authorization uses itinerary_id.';
comment on column public.trip_ledgers.owner_key is
  'Deprecated compatibility key. Never use for authorization.';

-- Rework durable versions so permission follows the parent itinerary.
alter table public.itinerary_versions
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists version bigint;

update public.itinerary_versions
set created_by = user_id
where created_by is null and user_id is not null;

with ranked as (
  select id,
         row_number() over (partition by itinerary_id order by created_at, id) as ordinal
  from public.itinerary_versions
)
update public.itinerary_versions version_row
set version = ranked.ordinal
from ranked
where version_row.id = ranked.id
  and version_row.version is null;

alter table public.itinerary_versions
  alter column version set default 1,
  alter column version set not null;

create unique index if not exists itinerary_versions_trip_version_idx
  on public.itinerary_versions(itinerary_id, version);

comment on column public.itinerary_versions.user_id is
  'Deprecated compatibility actor. Authorization follows itinerary membership.';

-- ---------------------------------------------------------------------------
-- Role helpers. SECURITY DEFINER avoids recursive trip_members RLS evaluation.
-- ---------------------------------------------------------------------------

create or replace function public.current_user_has_trip_role(
  p_trip_id uuid,
  p_roles text[] default array['owner', 'editor', 'viewer']::text[]
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.trip_members member
    where member.trip_id = p_trip_id
      and member.user_id = auth.uid()
      and member.revoked_at is null
      and member.role = any(p_roles)
  );
$$;

create or replace function public.current_user_owns_trip(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.itineraries itinerary
    where itinerary.id = p_trip_id
      and itinerary.owner_id = auth.uid()
  );
$$;

revoke all on function public.current_user_has_trip_role(uuid, text[]) from public;
revoke all on function public.current_user_owns_trip(uuid) from public;
grant execute on function public.current_user_has_trip_role(uuid, text[]) to authenticated;
grant execute on function public.current_user_owns_trip(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Integrity and optimistic concurrency triggers
-- ---------------------------------------------------------------------------

create or replace function public.enforce_itinerary_invariants()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    if new.owner_id is null and new.user_id is not null then
      new.owner_id := new.user_id;
    end if;

    if new.owner_id is not null and new.user_id is not null and new.owner_id <> new.user_id then
      raise exception 'owner_id and deprecated user_id must match'
        using errcode = '23514';
    end if;

    if new.owner_id is null then
      new.status := 'legacy_pending';
      new.visibility := 'private';
      new.legacy_quarantined_at := coalesce(new.legacy_quarantined_at, now());
    else
      new.user_id := new.owner_id;
      new.owner_key := 'supabase:' || new.owner_id::text;
      if new.status = 'legacy_pending' then
        new.status := 'active';
      end if;
      new.legacy_quarantined_at := null;
    end if;

    new.version := greatest(coalesce(new.version, 1), 1);
    new.schema_version := greatest(coalesce(new.schema_version, 1), 1);
    new.currency := upper(coalesce(nullif(trim(new.currency), ''), 'EUR'));
    new.created_at := coalesce(new.created_at, now());
    new.updated_at := coalesce(new.updated_at, now());
    return new;
  end if;

  if new.id is distinct from old.id
     or new.created_at is distinct from old.created_at then
    raise exception 'itinerary identity and creation timestamp are immutable'
      using errcode = '42501';
  end if;

  if new.owner_id is distinct from old.owner_id then
    -- Only a privileged maintenance/claim flow may attach a quarantined row.
    if not (
      old.owner_id is null
      and new.owner_id is not null
      and current_user in ('postgres', 'service_role', 'supabase_admin')
    ) then
      raise exception 'canonical itinerary owner cannot be changed'
        using errcode = '42501';
    end if;
  end if;

  if old.owner_id is not null and new.user_id is distinct from old.owner_id then
    raise exception 'deprecated user_id cannot diverge from owner_id'
      using errcode = '42501';
  end if;

  if auth.uid() is not null and new.share_token is distinct from old.share_token then
    raise exception 'deprecated share_token is immutable'
      using errcode = '42501';
  end if;

  if auth.uid() is not null
     and (
       new.visibility is distinct from old.visibility
       or new.status is distinct from old.status
       or new.deleted_at is distinct from old.deleted_at
     )
     and not public.current_user_owns_trip(old.id) then
    raise exception 'only the owner can change visibility, lifecycle or deletion state'
      using errcode = '42501';
  end if;

  new.user_id := new.owner_id;
  if new.owner_id is not null then
    new.owner_key := 'supabase:' || new.owner_id::text;
  end if;
  new.currency := upper(coalesce(nullif(trim(new.currency), ''), old.currency));
  new.schema_version := greatest(coalesce(new.schema_version, old.schema_version), 1);
  new.version := old.version + 1;
  new.updated_at := now();

  if new.deleted_at is not null then
    new.status := 'deleted';
  elsif old.deleted_at is not null and new.deleted_at is null and new.status = 'deleted' then
    new.status := 'active';
  end if;

  return new;
end;
$$;

drop trigger if exists itineraries_enforce_invariants on public.itineraries;
create trigger itineraries_enforce_invariants
before insert or update on public.itineraries
for each row execute function public.enforce_itinerary_invariants();

create or replace function public.ensure_itinerary_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.owner_id is not null then
    insert into public.trip_members (
      trip_id, user_id, role, invited_by, accepted_at, revoked_at
    ) values (
      new.id, new.owner_id, 'owner', new.owner_id, now(), null
    )
    on conflict (trip_id, user_id) do update
    set role = 'owner', revoked_at = null, updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists itineraries_ensure_owner_membership on public.itineraries;
create trigger itineraries_ensure_owner_membership
after insert or update of owner_id on public.itineraries
for each row execute function public.ensure_itinerary_owner_membership();

create or replace function public.enforce_trip_member_invariants()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  canonical_owner uuid;
begin
  select owner_id into canonical_owner
  from public.itineraries
  where id = new.trip_id;

  if canonical_owner is null then
    raise exception 'members cannot be attached to a quarantined itinerary'
      using errcode = '23514';
  end if;

  if new.user_id = canonical_owner and new.role <> 'owner' then
    raise exception 'canonical owner membership must retain owner role'
      using errcode = '42501';
  end if;

  if new.role = 'owner' and new.user_id <> canonical_owner then
    raise exception 'owner role cannot be granted through membership mutation'
      using errcode = '42501';
  end if;

  if new.role = 'owner' and new.revoked_at is not null then
    raise exception 'canonical owner membership cannot be revoked'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' then
    if new.trip_id <> old.trip_id or new.user_id <> old.user_id then
      raise exception 'membership identity is immutable'
        using errcode = '42501';
    end if;

    if old.role = 'owner'
       and (new.role <> 'owner' or new.revoked_at is not null) then
      raise exception 'last owner cannot be demoted or revoked'
        using errcode = '42501';
    end if;

    if old.role <> 'owner' and new.role = 'owner' then
      raise exception 'self-escalation to owner is forbidden'
        using errcode = '42501';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trip_members_enforce_invariants on public.trip_members;
create trigger trip_members_enforce_invariants
before insert or update on public.trip_members
for each row execute function public.enforce_trip_member_invariants();

create or replace function public.prevent_owner_membership_delete()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.role = 'owner'
     and exists (select 1 from public.itineraries where id = old.trip_id) then
    raise exception 'last owner membership cannot be removed'
      using errcode = '42501';
  end if;
  return old;
end;
$$;

drop trigger if exists trip_members_prevent_owner_delete on public.trip_members;
create trigger trip_members_prevent_owner_delete
before delete on public.trip_members
for each row execute function public.prevent_owner_membership_delete();

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_row_updated_at();

drop trigger if exists trip_invitations_set_updated_at on public.trip_invitations;
create trigger trip_invitations_set_updated_at
before update on public.trip_invitations
for each row execute function public.set_row_updated_at();

drop trigger if exists trip_share_links_set_updated_at on public.trip_share_links;
create trigger trip_share_links_set_updated_at
before update on public.trip_share_links
for each row execute function public.set_row_updated_at();

drop trigger if exists trip_imports_set_updated_at on public.trip_imports;
create trigger trip_imports_set_updated_at
before update on public.trip_imports
for each row execute function public.set_row_updated_at();

create or replace function public.canonicalize_trip_ledger()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  canonical_owner uuid;
begin
  if new.itinerary_id is null
     and new.trip_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    if exists (
      select 1 from public.itineraries
      where id = new.trip_key::uuid and owner_id is not null
    ) then
      new.itinerary_id := new.trip_key::uuid;
    end if;
  end if;

  if new.itinerary_id is null then
    new.legacy_quarantined_at := coalesce(new.legacy_quarantined_at, now());
  else
    select owner_id into canonical_owner
    from public.itineraries
    where id = new.itinerary_id;

    if canonical_owner is null then
      raise exception 'canonical ledger requires an owned itinerary'
        using errcode = '23514';
    end if;

    if tg_op = 'UPDATE' and new.itinerary_id is distinct from old.itinerary_id then
      raise exception 'ledger itinerary is immutable'
        using errcode = '42501';
    end if;

    new.trip_key := new.itinerary_id::text;
    new.owner_key := 'supabase:' || canonical_owner::text;
    new.legacy_quarantined_at := null;
  end if;

  if tg_op = 'UPDATE' then
    new.version := old.version + 1;
  else
    new.version := greatest(coalesce(new.version, 1), 1);
    new.created_at := coalesce(new.created_at, now());
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trip_ledgers_canonicalize on public.trip_ledgers;
create trigger trip_ledgers_canonicalize
before insert or update on public.trip_ledgers
for each row execute function public.canonicalize_trip_ledger();

-- Invitation acceptance deliberately has no authenticated SQL RPC. The server
-- resolves the opaque hash through its narrow service-role boundary, verifies
-- the invitee's HMAC email fingerprint, and only then writes the stored role.
drop function if exists public.accept_trip_invitation(text);

-- ---------------------------------------------------------------------------
-- Append-only audit helpers and trigger coverage
-- ---------------------------------------------------------------------------

create or replace function public.record_trip_audit_event(
  p_trip_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.audit_events (
    actor_user_id, trip_id, action, resource_type, resource_id, metadata
  ) values (
    auth.uid(), p_trip_id, p_action, p_resource_type, p_resource_id,
    case when jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) = 'object'
      then coalesce(p_metadata, '{}'::jsonb)
      else '{}'::jsonb
    end
  );
end;
$$;

revoke all on function public.record_trip_audit_event(uuid, text, text, uuid, jsonb) from public;

create or replace function public.normalize_audit_event()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.actor_user_id := coalesce(new.actor_user_id, auth.uid());
  new.correlation_id := coalesce(new.correlation_id, gen_random_uuid()::text);

  if new.trip_id is null and new.resource_type = 'trip' then
    new.trip_id := new.resource_id;
  elsif new.trip_id is null and new.resource_type = 'trip_invitation' then
    select invitation.trip_id into new.trip_id
    from public.trip_invitations invitation
    where invitation.id = new.resource_id;
  elsif new.trip_id is null and new.resource_type = 'trip_share_link' then
    select share_link.trip_id into new.trip_id
    from public.trip_share_links share_link
    where share_link.id = new.resource_id;
  end if;

  return new;
end;
$$;

drop trigger if exists audit_events_normalize on public.audit_events;
create trigger audit_events_normalize
before insert on public.audit_events
for each row execute function public.normalize_audit_event();

create or replace function public.audit_itinerary_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    perform public.record_trip_audit_event(new.id, 'trip.created', 'trip', new.id,
      jsonb_build_object('version', new.version, 'visibility', new.visibility));
    return new;
  elsif tg_op = 'UPDATE' then
    perform public.record_trip_audit_event(new.id,
      case
        when new.deleted_at is not null and old.deleted_at is null then 'trip.deleted'
        when new.deleted_at is null and old.deleted_at is not null then 'trip.restored'
        else 'trip.updated'
      end,
      'trip', new.id,
      jsonb_build_object('version', new.version, 'status', new.status, 'visibility', new.visibility));
    return new;
  else
    perform public.record_trip_audit_event(old.id, 'trip.purged', 'trip', old.id,
      jsonb_build_object('version', old.version));
    return old;
  end if;
end;
$$;

drop trigger if exists itineraries_audit on public.itineraries;
create trigger itineraries_audit
after insert or update or delete on public.itineraries
for each row execute function public.audit_itinerary_change();

create or replace function public.audit_membership_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  row_value public.trip_members%rowtype;
  event_action text;
begin
  if tg_op = 'DELETE' then
    row_value := old;
    event_action := 'member.removed';
  elsif tg_op = 'INSERT' then
    row_value := new;
    event_action := 'member.added';
  else
    row_value := new;
    event_action := case
      when new.revoked_at is not null and old.revoked_at is null then 'member.revoked'
      else 'member.updated'
    end;
  end if;
  perform public.record_trip_audit_event(
    row_value.trip_id,
    event_action,
    'member', row_value.user_id,
    jsonb_build_object('role', row_value.role)
  );
  return row_value;
end;
$$;

drop trigger if exists trip_members_audit on public.trip_members;
create trigger trip_members_audit
after insert or update or delete on public.trip_members
for each row execute function public.audit_membership_change();

create or replace function public.audit_share_link_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  row_value public.trip_share_links%rowtype;
  event_action text;
begin
  if tg_op = 'DELETE' then
    row_value := old;
    event_action := 'share.deleted';
  elsif tg_op = 'INSERT' then
    row_value := new;
    event_action := 'share.created';
  else
    row_value := new;
    event_action := case
      when new.revoked_at is not null and old.revoked_at is null then 'share.revoked'
      else 'share.updated'
    end;
  end if;
  perform public.record_trip_audit_event(
    row_value.trip_id,
    event_action,
    'share_link', row_value.id,
    jsonb_build_object('audience', row_value.audience)
  );
  return row_value;
end;
$$;

drop trigger if exists trip_share_links_audit on public.trip_share_links;
create trigger trip_share_links_audit
after insert or update or delete on public.trip_share_links
for each row execute function public.audit_share_link_change();

create or replace function public.audit_invitation_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  row_value public.trip_invitations%rowtype;
  event_action text;
begin
  if tg_op = 'DELETE' then
    row_value := old;
    event_action := 'invitation.deleted';
  elsif tg_op = 'INSERT' then
    row_value := new;
    event_action := 'invitation.created';
  else
    row_value := new;
    event_action := case
      when new.accepted_at is not null and old.accepted_at is null then 'invitation.accepted'
      when new.revoked_at is not null and old.revoked_at is null then 'invitation.revoked'
      else 'invitation.updated'
    end;
  end if;
  perform public.record_trip_audit_event(
    row_value.trip_id,
    event_action,
    'invitation', row_value.id,
    jsonb_build_object('role', row_value.role)
  );
  return row_value;
end;
$$;

drop trigger if exists trip_invitations_audit on public.trip_invitations;
create trigger trip_invitations_audit
after insert or update or delete on public.trip_invitations
for each row execute function public.audit_invitation_change();

-- ---------------------------------------------------------------------------
-- RLS: every action is explicit. False policies document service-only actions.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.itineraries enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_invitations enable row level security;
alter table public.trip_share_links enable row level security;
alter table public.audit_events enable row level security;
alter table public.trip_imports enable row level security;
alter table public.itinerary_versions enable row level security;
alter table public.itinerary_shares enable row level security;
alter table public.trip_ledgers enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.custom_requests enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (id = auth.uid());

drop policy if exists "itineraries_select_own_or_shared" on public.itineraries;
drop policy if exists "itineraries_select_own" on public.itineraries;
drop policy if exists "itineraries_insert_own" on public.itineraries;
drop policy if exists "itineraries_update_own" on public.itineraries;
drop policy if exists "itineraries_select_member" on public.itineraries;
drop policy if exists "itineraries_insert_owner" on public.itineraries;
drop policy if exists "itineraries_update_owner_editor" on public.itineraries;
drop policy if exists "itineraries_delete_owner" on public.itineraries;
create policy "itineraries_select_member" on public.itineraries
  for select to authenticated
  using (public.current_user_has_trip_role(id, array['owner', 'editor', 'viewer']::text[]));
create policy "itineraries_insert_owner" on public.itineraries
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and user_id = auth.uid()
    and status = 'active'
    and visibility = 'private'
    and deleted_at is null
  );
create policy "itineraries_update_owner_editor" on public.itineraries
  for update to authenticated
  using (public.current_user_has_trip_role(id, array['owner', 'editor']::text[]))
  with check (public.current_user_has_trip_role(id, array['owner', 'editor']::text[]));
create policy "itineraries_delete_owner" on public.itineraries
  for delete to authenticated
  using (public.current_user_owns_trip(id));

drop policy if exists "trip_members_select_member" on public.trip_members;
drop policy if exists "trip_members_insert_owner" on public.trip_members;
drop policy if exists "trip_members_update_owner" on public.trip_members;
drop policy if exists "trip_members_delete_owner_or_self" on public.trip_members;
create policy "trip_members_select_member" on public.trip_members
  for select to authenticated
  using (public.current_user_has_trip_role(trip_id));
create policy "trip_members_insert_owner" on public.trip_members
  for insert to authenticated
  with check (
    public.current_user_owns_trip(trip_id)
    and role in ('editor', 'viewer')
    and user_id <> auth.uid()
    and invited_by = auth.uid()
    and revoked_at is null
  );
create policy "trip_members_update_owner" on public.trip_members
  for update to authenticated
  using (public.current_user_owns_trip(trip_id) and role <> 'owner')
  with check (public.current_user_owns_trip(trip_id) and role in ('editor', 'viewer'));
create policy "trip_members_delete_owner_or_self" on public.trip_members
  for delete to authenticated
  using (
    role <> 'owner'
    and (public.current_user_owns_trip(trip_id) or user_id = auth.uid())
  );

drop policy if exists "trip_invitations_select_owner" on public.trip_invitations;
drop policy if exists "trip_invitations_insert_owner" on public.trip_invitations;
drop policy if exists "trip_invitations_update_owner" on public.trip_invitations;
drop policy if exists "trip_invitations_delete_owner" on public.trip_invitations;
create policy "trip_invitations_select_owner" on public.trip_invitations
  for select to authenticated using (public.current_user_owns_trip(trip_id));
create policy "trip_invitations_insert_owner" on public.trip_invitations
  for insert to authenticated
  with check (
    public.current_user_owns_trip(trip_id)
    and invited_by = auth.uid()
    and role in ('editor', 'viewer')
  );
create policy "trip_invitations_update_owner" on public.trip_invitations
  for update to authenticated
  using (public.current_user_owns_trip(trip_id))
  with check (public.current_user_owns_trip(trip_id) and role in ('editor', 'viewer'));
create policy "trip_invitations_delete_owner" on public.trip_invitations
  for delete to authenticated using (public.current_user_owns_trip(trip_id));

drop policy if exists "trip_share_links_select_owner" on public.trip_share_links;
drop policy if exists "trip_share_links_insert_owner" on public.trip_share_links;
drop policy if exists "trip_share_links_update_owner" on public.trip_share_links;
drop policy if exists "trip_share_links_delete_owner" on public.trip_share_links;
create policy "trip_share_links_select_owner" on public.trip_share_links
  for select to authenticated using (public.current_user_owns_trip(trip_id));
create policy "trip_share_links_insert_owner" on public.trip_share_links
  for insert to authenticated
  with check (public.current_user_owns_trip(trip_id) and created_by = auth.uid());
create policy "trip_share_links_update_owner" on public.trip_share_links
  for update to authenticated
  using (public.current_user_owns_trip(trip_id))
  with check (public.current_user_owns_trip(trip_id));
create policy "trip_share_links_delete_owner" on public.trip_share_links
  for delete to authenticated using (public.current_user_owns_trip(trip_id));

drop policy if exists "audit_events_select_owner" on public.audit_events;
drop policy if exists "audit_events_insert_service_only" on public.audit_events;
drop policy if exists "audit_events_update_never" on public.audit_events;
drop policy if exists "audit_events_delete_never" on public.audit_events;
create policy "audit_events_select_owner" on public.audit_events
  for select to authenticated using (public.current_user_owns_trip(trip_id));
create policy "audit_events_insert_service_only" on public.audit_events
  for insert to authenticated with check (false);
create policy "audit_events_update_never" on public.audit_events
  for update to authenticated using (false) with check (false);
create policy "audit_events_delete_never" on public.audit_events
  for delete to authenticated using (false);

drop policy if exists "trip_imports_select_own" on public.trip_imports;
drop policy if exists "trip_imports_insert_pending_own" on public.trip_imports;
drop policy if exists "trip_imports_insert_own" on public.trip_imports;
drop policy if exists "trip_imports_update_service_only" on public.trip_imports;
drop policy if exists "trip_imports_delete_service_only" on public.trip_imports;
create policy "trip_imports_select_own" on public.trip_imports
  for select to authenticated using (user_id = auth.uid());
create policy "trip_imports_insert_own" on public.trip_imports
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      (status = 'pending' and trip_id is null and completed_at is null)
      or
      (status = 'completed' and trip_id is not null and public.current_user_owns_trip(trip_id))
    )
  );
create policy "trip_imports_update_service_only" on public.trip_imports
  for update to authenticated using (false) with check (false);
create policy "trip_imports_delete_service_only" on public.trip_imports
  for delete to authenticated using (false);

drop policy if exists "versions_select_own" on public.itinerary_versions;
drop policy if exists "versions_insert_own" on public.itinerary_versions;
drop policy if exists "versions_select_member" on public.itinerary_versions;
drop policy if exists "versions_insert_owner_editor" on public.itinerary_versions;
drop policy if exists "versions_update_never" on public.itinerary_versions;
drop policy if exists "versions_delete_owner" on public.itinerary_versions;
create policy "versions_select_member" on public.itinerary_versions
  for select to authenticated using (public.current_user_has_trip_role(itinerary_id));
create policy "versions_insert_owner_editor" on public.itinerary_versions
  for insert to authenticated
  with check (
    public.current_user_has_trip_role(itinerary_id, array['owner', 'editor']::text[])
    and created_by = auth.uid()
    and user_id = auth.uid()
  );
create policy "versions_update_never" on public.itinerary_versions
  for update to authenticated using (false) with check (false);
create policy "versions_delete_owner" on public.itinerary_versions
  for delete to authenticated using (public.current_user_owns_trip(itinerary_id));

drop policy if exists "trip_ledgers_select_member" on public.trip_ledgers;
drop policy if exists "trip_ledgers_insert_owner_editor" on public.trip_ledgers;
drop policy if exists "trip_ledgers_update_owner_editor" on public.trip_ledgers;
drop policy if exists "trip_ledgers_delete_owner" on public.trip_ledgers;
create policy "trip_ledgers_select_member" on public.trip_ledgers
  for select to authenticated
  using (itinerary_id is not null and public.current_user_has_trip_role(itinerary_id));
create policy "trip_ledgers_insert_owner_editor" on public.trip_ledgers
  for insert to authenticated
  with check (
    itinerary_id is not null
    and public.current_user_has_trip_role(itinerary_id, array['owner', 'editor']::text[])
  );
create policy "trip_ledgers_update_owner_editor" on public.trip_ledgers
  for update to authenticated
  using (
    itinerary_id is not null
    and public.current_user_has_trip_role(itinerary_id, array['owner', 'editor']::text[])
  )
  with check (
    itinerary_id is not null
    and public.current_user_has_trip_role(itinerary_id, array['owner', 'editor']::text[])
  );
create policy "trip_ledgers_delete_owner" on public.trip_ledgers
  for delete to authenticated
  using (itinerary_id is not null and public.current_user_owns_trip(itinerary_id));

-- Legacy share snapshots are service-only: all four operations are explicit deny.
drop policy if exists "itinerary_shares_select_never" on public.itinerary_shares;
drop policy if exists "itinerary_shares_insert_never" on public.itinerary_shares;
drop policy if exists "itinerary_shares_update_never" on public.itinerary_shares;
drop policy if exists "itinerary_shares_delete_never" on public.itinerary_shares;
create policy "itinerary_shares_select_never" on public.itinerary_shares
  for select to authenticated using (false);
create policy "itinerary_shares_insert_never" on public.itinerary_shares
  for insert to authenticated with check (false);
create policy "itinerary_shares_update_never" on public.itinerary_shares
  for update to authenticated using (false) with check (false);
create policy "itinerary_shares_delete_never" on public.itinerary_shares
  for delete to authenticated using (false);

-- Public form writes must go through validated server routes, never the Data API.
drop policy if exists "newsletter_insert_anyone" on public.newsletter_subscribers;
drop policy if exists "newsletter_select_never" on public.newsletter_subscribers;
drop policy if exists "newsletter_insert_server_only" on public.newsletter_subscribers;
drop policy if exists "newsletter_update_server_only" on public.newsletter_subscribers;
drop policy if exists "newsletter_delete_server_only" on public.newsletter_subscribers;
create policy "newsletter_select_never" on public.newsletter_subscribers
  for select to authenticated using (false);
create policy "newsletter_insert_server_only" on public.newsletter_subscribers
  for insert to authenticated with check (false);
create policy "newsletter_update_server_only" on public.newsletter_subscribers
  for update to authenticated using (false) with check (false);
create policy "newsletter_delete_server_only" on public.newsletter_subscribers
  for delete to authenticated using (false);

drop policy if exists "custom_requests_insert_anyone" on public.custom_requests;
drop policy if exists "custom_requests_select_own" on public.custom_requests;
drop policy if exists "custom_requests_insert_server_only" on public.custom_requests;
drop policy if exists "custom_requests_update_server_only" on public.custom_requests;
drop policy if exists "custom_requests_delete_own" on public.custom_requests;
create policy "custom_requests_select_own" on public.custom_requests
  for select to authenticated using (user_id = auth.uid());
create policy "custom_requests_insert_server_only" on public.custom_requests
  for insert to authenticated with check (false);
create policy "custom_requests_update_server_only" on public.custom_requests
  for update to authenticated using (false) with check (false);
create policy "custom_requests_delete_own" on public.custom_requests
  for delete to authenticated using (user_id = auth.uid());

-- Explicit grants keep the migration portable across projects with different
-- default privileges. RLS remains the authority for authenticated access.
grant usage on schema public to authenticated;
grant select, insert, update, delete on table
  public.profiles,
  public.itineraries,
  public.trip_members,
  public.trip_invitations,
  public.trip_share_links,
  public.audit_events,
  public.trip_imports,
  public.itinerary_versions,
  public.itinerary_shares,
  public.trip_ledgers,
  public.newsletter_subscribers,
  public.custom_requests
to authenticated;

revoke all on table
  public.itineraries,
  public.trip_members,
  public.trip_invitations,
  public.trip_share_links,
  public.audit_events,
  public.trip_imports,
  public.itinerary_versions,
  public.itinerary_shares,
  public.trip_ledgers
from anon;

commit;
