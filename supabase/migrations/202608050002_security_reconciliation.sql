-- Reconcile authorization gaps that cannot be fixed safely in application code.

begin;

-- A previously published snapshot exposed this token-only RPC to authenticated
-- clients. Drop it explicitly so upgraded projects do not retain the function.
drop function if exists public.accept_trip_invitation(text);

-- Repeat upgrade-sensitive normalization here. Projects that already recorded
-- 202608020001 will not execute additions made retroactively to that file.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'audit_events' and column_name = 'actor_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'audit_events' and column_name = 'actor_user_id'
  ) then
    alter table public.audit_events rename column actor_id to actor_user_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'audit_events' and column_name = 'target_type'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'audit_events' and column_name = 'resource_type'
  ) then
    alter table public.audit_events rename column target_type to resource_type;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'audit_events' and column_name = 'target_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'audit_events' and column_name = 'resource_id'
  ) then
    alter table public.audit_events rename column target_id to resource_id;
  end if;

  alter table public.audit_events
    add column if not exists actor_user_id uuid references auth.users(id) on delete set null,
    add column if not exists resource_type text,
    add column if not exists resource_id uuid;

  update public.audit_events
  set resource_type = coalesce(nullif(resource_type, ''), 'legacy'),
      resource_id = coalesce(resource_id, id)
  where resource_type is null or resource_type = '' or resource_id is null;

  alter table public.audit_events
    alter column resource_type set not null,
    alter column resource_id set not null,
    alter column correlation_id type text using correlation_id::text;

  update public.audit_events
  set correlation_id = gen_random_uuid()::text
  where correlation_id is null or trim(correlation_id) = '';

  alter table public.audit_events
    alter column correlation_id set default gen_random_uuid()::text,
    alter column correlation_id set not null;
end
$$;

alter table public.trip_imports drop constraint if exists trip_imports_status_check;
alter table public.trip_imports drop constraint if exists trip_imports_completion_check;
update public.trip_imports
set status = 'completed',
    completed_at = coalesce(completed_at, updated_at, now())
where status = 'imported';
alter table public.trip_imports
  add constraint trip_imports_status_check
    check (status in ('pending', 'completed', 'conflict', 'failed')),
  add constraint trip_imports_completion_check
    check ((status = 'pending' and completed_at is null) or status <> 'pending');

-- Password and OAuth users both pass through auth.users. Backfill accounts that
-- existed before the trigger migration, without overwriting a chosen name.
insert into public.profiles as existing (id, email, name)
select
  auth_user.id,
  coalesce(auth_user.email, ''),
  coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'name', ''),
    nullif(auth_user.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(coalesce(auth_user.email, ''), '@', 1), ''),
    'Viajante'
  )
from auth.users auth_user
on conflict (id) do update
set email = excluded.email,
    name = coalesce(nullif(existing.name, ''), excluded.name),
    updated_at = now();

alter table public.itineraries alter column status set default 'draft';

-- A profile belongs to the auth account lifecycle. Deleting the row directly
-- would bypass the auth.users trigger and leave subsequent sessions incomplete.
drop policy if exists "profiles_delete_own" on public.profiles;
drop policy if exists "profiles_delete_never" on public.profiles;
create policy "profiles_delete_never" on public.profiles
  for delete to authenticated using (false);

-- Soft-deleted trips are hidden from collaborators and cannot be edited. The
-- owner may still read one for recovery and perform the update that deletes it.
drop policy if exists "itineraries_select_member" on public.itineraries;
create policy "itineraries_select_member" on public.itineraries
  for select to authenticated
  using (
    owner_id = auth.uid()
    or (
      deleted_at is null
      and public.current_user_has_trip_role(
        id, array['owner', 'editor', 'viewer']::text[]
      )
    )
  );

drop policy if exists "itineraries_update_owner_editor" on public.itineraries;
create policy "itineraries_update_owner_editor" on public.itineraries
  for update to authenticated
  using (
    deleted_at is null
    and public.current_user_has_trip_role(id, array['owner', 'editor']::text[])
  )
  with check (
    public.current_user_has_trip_role(id, array['owner', 'editor']::text[])
    and (deleted_at is null or public.current_user_owns_trip(id))
  );

drop policy if exists "trip_members_select_member" on public.trip_members;
create policy "trip_members_select_member" on public.trip_members
  for select to authenticated
  using (
    public.current_user_owns_trip(trip_id)
    or (revoked_at is null and public.current_user_has_trip_role(trip_id))
  );

-- Membership creation follows owner-creation triggers or invitation acceptance;
-- it is not a direct client mutation.
drop policy if exists "trip_members_insert_owner" on public.trip_members;
drop policy if exists "trip_members_insert_service_only" on public.trip_members;
create policy "trip_members_insert_service_only" on public.trip_members
  for insert to authenticated with check (false);

-- Authenticated owners may only revoke a pending invitation. Accepted state,
-- recipient hashes and tokens are immutable through the Data API.
create or replace function public.enforce_trip_invitation_client_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      if new.accepted_at is not null
         or new.accepted_by is not null
         or new.revoked_at is not null then
        raise exception 'new invitations must be pending'
          using errcode = '42501';
      end if;
    elsif new.id is distinct from old.id
       or new.trip_id is distinct from old.trip_id
       or new.email_hash is distinct from old.email_hash
       or new.role is distinct from old.role
       or new.invited_by is distinct from old.invited_by
       or new.token_hash is distinct from old.token_hash
       or new.expires_at is distinct from old.expires_at
       or new.accepted_by is distinct from old.accepted_by
       or new.accepted_at is distinct from old.accepted_at
       or new.created_at is distinct from old.created_at
       or old.accepted_at is not null
       or old.revoked_at is not null
       or new.revoked_at is null then
      raise exception 'only pending invitation revocation is allowed'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_trip_invitation_client_update() from public;
drop trigger if exists trip_invitations_enforce_client_update on public.trip_invitations;
create trigger trip_invitations_enforce_client_update
before insert or update on public.trip_invitations
for each row execute function public.enforce_trip_invitation_client_update();

drop policy if exists "trip_invitations_insert_owner" on public.trip_invitations;
create policy "trip_invitations_insert_owner" on public.trip_invitations
  for insert to authenticated
  with check (
    public.current_user_owns_trip(trip_id)
    and invited_by = auth.uid()
    and role in ('editor', 'viewer')
    and accepted_at is null
    and accepted_by is null
    and revoked_at is null
  );

drop policy if exists "trip_invitations_update_owner" on public.trip_invitations;
drop policy if exists "trip_invitations_revoke_owner" on public.trip_invitations;
create policy "trip_invitations_revoke_owner" on public.trip_invitations
  for update to authenticated
  using (
    public.current_user_owns_trip(trip_id)
    and accepted_at is null
    and revoked_at is null
  )
  with check (
    public.current_user_owns_trip(trip_id)
    and accepted_at is null
    and accepted_by is null
    and revoked_at is not null
  );

-- Share-link clients likewise get a revocation transition, not arbitrary token,
-- creator, expiry or usage-counter updates.
create or replace function public.enforce_trip_share_client_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' then
    if new.id is distinct from old.id
       or new.trip_id is distinct from old.trip_id
       or new.token_hash is distinct from old.token_hash
       or new.permission is distinct from old.permission
       or new.audience is distinct from old.audience
       or new.created_by is distinct from old.created_by
       or new.expires_at is distinct from old.expires_at
       or new.max_uses is distinct from old.max_uses
       or new.use_count is distinct from old.use_count
       or new.last_accessed_at is distinct from old.last_accessed_at
       or new.created_at is distinct from old.created_at
       or old.revoked_at is not null
       or new.revoked_at is null then
      raise exception 'only active share-link revocation is allowed'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_trip_share_client_update() from public;
drop trigger if exists trip_share_links_enforce_client_update on public.trip_share_links;
create trigger trip_share_links_enforce_client_update
before update on public.trip_share_links
for each row execute function public.enforce_trip_share_client_update();

drop policy if exists "trip_share_links_update_owner" on public.trip_share_links;
drop policy if exists "trip_share_links_revoke_owner" on public.trip_share_links;
create policy "trip_share_links_revoke_owner" on public.trip_share_links
  for update to authenticated
  using (public.current_user_owns_trip(trip_id) and revoked_at is null)
  with check (public.current_user_owns_trip(trip_id) and revoked_at is not null);

-- Trigger-generated audit records need the authenticated actor even when a
-- narrow service-role RPC performs the transaction on that user's behalf.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.current_audit_actor()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  delegated_actor text := current_setting('andor.actor_user_id', true);
begin
  if auth.uid() is not null then
    return auth.uid();
  end if;
  if delegated_actor ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return delegated_actor::uuid;
  end if;
  return null;
end;
$$;

revoke all on function private.current_audit_actor() from public, anon, authenticated;

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
set search_path = ''
as $$
begin
  insert into public.audit_events (
    actor_user_id, trip_id, action, resource_type, resource_id, metadata
  ) values (
    private.current_audit_actor(), p_trip_id, p_action, p_resource_type, p_resource_id,
    case when jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) = 'object'
      then coalesce(p_metadata, '{}'::jsonb)
      else '{}'::jsonb
    end
  );
end;
$$;

revoke all on function public.record_trip_audit_event(uuid, text, text, uuid, jsonb)
  from public, anon, authenticated;

create or replace function public.normalize_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.actor_user_id := coalesce(new.actor_user_id, private.current_audit_actor());
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

revoke all on function public.normalize_audit_event() from public, anon, authenticated;

-- Atomic, idempotent acceptance. Raw tokens never enter Postgres: the server
-- sends a SHA-256 token hash plus the authenticated user's HMAC email hash.
create or replace function public.accept_trip_invitation_transaction(
  p_token_hash text,
  p_user_id uuid,
  p_email_hash text
)
returns table (status text, trip_id uuid, role text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.trip_invitations%rowtype;
  trip_owner uuid;
  affected_rows bigint;
begin
  if p_user_id is null
     or p_token_hash !~ '^[0-9a-f]{64}$'
     or p_email_hash !~ '^[0-9a-f]{64}$'
     or not exists (select 1 from auth.users where id = p_user_id) then
    return query select 'not_found'::text, null::uuid, null::text;
    return;
  end if;

  select candidate.* into invitation
  from public.trip_invitations candidate
  where candidate.token_hash = p_token_hash
  for update;

  if not found then
    return query select 'not_found'::text, null::uuid, null::text;
    return;
  end if;

  if invitation.accepted_at is not null then
    if invitation.accepted_by = p_user_id then
      if exists (
        select 1 from public.trip_members member
        where member.trip_id = invitation.trip_id
          and member.user_id = p_user_id
          and member.role = invitation.role
          and member.revoked_at is null
      ) then
        return query select 'already_accepted'::text, invitation.trip_id, invitation.role;
      else
        return query select 'invalid_state'::text, null::uuid, null::text;
      end if;
    else
      return query select 'not_found'::text, null::uuid, null::text;
    end if;
    return;
  end if;

  if invitation.revoked_at is not null then
    return query select 'revoked'::text, null::uuid, null::text;
    return;
  end if;
  if invitation.expires_at <= now() then
    return query select 'expired'::text, null::uuid, null::text;
    return;
  end if;
  if invitation.email_hash is distinct from p_email_hash
     or invitation.role not in ('editor', 'viewer') then
    return query select 'forbidden'::text, null::uuid, null::text;
    return;
  end if;

  select itinerary.owner_id into trip_owner
  from public.itineraries itinerary
  where itinerary.id = invitation.trip_id
    and itinerary.deleted_at is null;

  if trip_owner is null
     or trip_owner = p_user_id
     or invitation.invited_by = p_user_id then
    return query select 'forbidden'::text, null::uuid, null::text;
    return;
  end if;

  perform set_config('andor.actor_user_id', p_user_id::text, true);

  insert into public.trip_members (
    trip_id, user_id, role, invited_by, accepted_at, revoked_at, updated_at
  ) values (
    invitation.trip_id, p_user_id, invitation.role, invitation.invited_by,
    now(), null, now()
  )
  on conflict on constraint trip_members_pkey do update
  set role = excluded.role,
      invited_by = excluded.invited_by,
      accepted_at = excluded.accepted_at,
      revoked_at = null,
      updated_at = excluded.updated_at
  where public.trip_members.role <> 'owner';

  update public.trip_invitations
  set accepted_by = p_user_id,
      accepted_at = now(),
      updated_at = now()
  where id = invitation.id
    and accepted_at is null
    and revoked_at is null
    and expires_at > now();

  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'invitation state changed during acceptance'
      using errcode = '40001';
  end if;

  return query select 'accepted'::text, invitation.trip_id, invitation.role;
end;
$$;

revoke all on function public.accept_trip_invitation_transaction(text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.accept_trip_invitation_transaction(text, uuid, text)
  to service_role;

grant all on table
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
to service_role;

commit;
