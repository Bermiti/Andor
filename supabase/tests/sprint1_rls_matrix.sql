-- Executable Sprint 1 RLS matrix (pgTAP-free).
--
-- Run only against a disposable local/staging Supabase database after migrations:
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 \
--     -f supabase/tests/sprint1_rls_matrix.sql
--
-- Every fixture is wrapped in this transaction and the final ROLLBACK removes it.
-- Do not change the final ROLLBACK to COMMIT.

begin;

create or replace function pg_temp.assert_true(condition boolean, message text)
returns void
language plpgsql
as $$
begin
  if condition is not true then
    raise exception 'ASSERTION FAILED: %', message;
  end if;
end;
$$;

create or replace function pg_temp.assert_throws(statement text, message text)
returns void
language plpgsql
as $$
begin
  begin
    execute statement;
  exception when others then
    return;
  end;
  raise exception 'ASSERTION FAILED (expected error): %', message;
end;
$$;

-- Reserved deterministic identities; transaction rollback prevents residue.
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'rls-owner@andor.invalid', crypt('Andor-Test-Only-1', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'rls-editor@andor.invalid', crypt('Andor-Test-Only-2', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
   'rls-viewer@andor.invalid', crypt('Andor-Test-Only-3', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated',
   'rls-outsider@andor.invalid', crypt('Andor-Test-Only-4', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated',
   'rls-invited@andor.invalid', crypt('Andor-Test-Only-5', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

select pg_temp.assert_true(
  (select count(*) = 5 from public.profiles
   where id in (
     '00000000-0000-4000-8000-000000000001',
     '00000000-0000-4000-8000-000000000002',
     '00000000-0000-4000-8000-000000000003',
     '00000000-0000-4000-8000-000000000004',
     '00000000-0000-4000-8000-000000000005'
   )),
  'auth.users insert trigger must create one profile per password or OAuth identity'
);

-- Pre-auth legacy rows stay private and ownerless until an explicit privileged
-- claim flow attaches them to a real identity.
insert into public.itineraries (id, user_id, owner_key, destination, itinerary)
values (
  '10000000-0000-4000-8000-000000000003', null, 'guest:legacy-test',
  'Legacy quarantine fixture', '{"days":[]}'::jsonb
);
select pg_temp.assert_true(
  (select owner_id is null
          and status = 'legacy_pending'
          and visibility = 'private'
          and legacy_quarantined_at is not null
   from public.itineraries
   where id = '10000000-0000-4000-8000-000000000003'),
  'ownerless legacy trip must be quarantined rather than auto-claimed'
);

-- Owner session. Both claims formats are populated because auth.uid() support
-- differs slightly between Supabase/PostgREST versions.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.profiles (id, email, name)
values ('00000000-0000-4000-8000-000000000001', 'rls-owner@andor.invalid', 'RLS Owner')
on conflict (id) do update
set email = excluded.email, name = excluded.name;

insert into public.itineraries (
  id, owner_id, destination, itinerary, visibility, status, currency, schema_version
)
values (
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'Lisbon', '{"days":[]}'::jsonb, 'private', 'draft', 'EUR', 1
);

-- PostgREST uses INSERT ... RETURNING for the application repository. The
-- SELECT policy must therefore recognize the just-inserted owner directly,
-- before relying on the membership created by the AFTER INSERT trigger.
select pg_temp.assert_true(
  (select owner_id = auth.uid()
   from public.itineraries
   where id = '10000000-0000-4000-8000-000000000001'),
  'owner must be able to read the row returned by the create operation'
);

select pg_temp.assert_true(
  (select count(*) = 1 from public.itineraries
   where id = '10000000-0000-4000-8000-000000000001'),
  'owner must read the created trip'
);
select pg_temp.assert_true(
  (select count(*) = 1 from public.trip_members
   where trip_id = '10000000-0000-4000-8000-000000000001'
     and user_id = '00000000-0000-4000-8000-000000000001'
     and role = 'owner'),
  'trip insert must create exactly one active owner membership'
);
select pg_temp.assert_true(
  (select owner_key = 'supabase:00000000-0000-4000-8000-000000000001'
   from public.itineraries where id = '10000000-0000-4000-8000-000000000001'),
  'legacy owner_key must be a non-authoritative canonical mirror'
);
select pg_temp.assert_throws(
  $sql$insert into public.itineraries
       (id, destination, itinerary, visibility, status, currency)
       values ('10000000-0000-4000-8000-000000000004', 'Ownerless bypass',
               '{"days":[]}'::jsonb, 'private', 'draft', 'EUR')$sql$,
  'authenticated client cannot create an ownerless trip'
);

select pg_temp.assert_throws(
  $sql$insert into public.trip_members (trip_id, user_id, role, invited_by)
       values ('10000000-0000-4000-8000-000000000001',
               '00000000-0000-4000-8000-000000000002', 'editor',
               '00000000-0000-4000-8000-000000000001')$sql$,
  'owner cannot bypass invitation acceptance with a direct membership insert'
);

select pg_temp.assert_throws(
  $sql$insert into public.trip_invitations
       (id, trip_id, email_hash, role, invited_by, token_hash, expires_at,
        accepted_at, accepted_by)
       values ('30000000-0000-4000-8000-000000000099',
               '10000000-0000-4000-8000-000000000001', repeat('9', 64),
               'viewer', '00000000-0000-4000-8000-000000000001',
               repeat('8', 64), now() + interval '2 days', now(),
               '00000000-0000-4000-8000-000000000003')$sql$,
  'owner cannot create a falsely accepted invitation through the Data API'
);

select pg_temp.assert_throws(
  $sql$insert into public.trip_invitations
       (id, trip_id, email_hash, role, invited_by, token_hash, expires_at, revoked_at)
       values ('30000000-0000-4000-8000-000000000098',
               '10000000-0000-4000-8000-000000000001', repeat('7', 64),
               'viewer', '00000000-0000-4000-8000-000000000001',
               repeat('6', 64), now() + interval '2 days', now())$sql$,
  'owner cannot create a falsely revoked invitation through the Data API'
);

insert into public.trip_invitations (
  id, trip_id, email_hash, role, invited_by, token_hash, expires_at
)
values
  ('30000000-0000-4000-8000-000000000010',
   '10000000-0000-4000-8000-000000000001',
   encode(digest('rls-editor@andor.invalid', 'sha256'), 'hex'), 'editor',
   '00000000-0000-4000-8000-000000000001', repeat('e', 64),
   now() + interval '2 days'),
  ('30000000-0000-4000-8000-000000000011',
   '10000000-0000-4000-8000-000000000001',
   encode(digest('rls-viewer@andor.invalid', 'sha256'), 'hex'), 'viewer',
   '00000000-0000-4000-8000-000000000001', repeat('f', 64),
   now() + interval '2 days');

reset role;
set local role service_role;
select pg_temp.assert_true(
  (select status = 'accepted' and role = 'editor'
   from public.accept_trip_invitation_transaction(
     repeat('e', 64),
     '00000000-0000-4000-8000-000000000002',
     encode(digest('rls-editor@andor.invalid', 'sha256'), 'hex')
   )),
  'service boundary atomically accepts the editor invitation'
);
select pg_temp.assert_true(
  (select status = 'accepted' and role = 'viewer'
   from public.accept_trip_invitation_transaction(
     repeat('f', 64),
     '00000000-0000-4000-8000-000000000003',
     encode(digest('rls-viewer@andor.invalid', 'sha256'), 'hex')
   )),
  'service boundary atomically accepts the viewer invitation'
);

update public.trip_members
set revoked_at = now()
where trip_id = '10000000-0000-4000-8000-000000000001'
  and user_id = '00000000-0000-4000-8000-000000000003';
select pg_temp.assert_true(
  (select status = 'invalid_state'
   from public.accept_trip_invitation_transaction(
     repeat('f', 64),
     '00000000-0000-4000-8000-000000000003',
     encode(digest('rls-viewer@andor.invalid', 'sha256'), 'hex')
   )),
  'accepted invitation replay must fail if its membership is no longer active'
);
update public.trip_members
set revoked_at = null
where trip_id = '10000000-0000-4000-8000-000000000001'
  and user_id = '00000000-0000-4000-8000-000000000003';

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.trip_share_links (
  id, trip_id, token_hash, permission, audience, expires_at, created_by
)
values (
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001', repeat('a', 64),
  'viewer', 'client', now() + interval '7 days',
  '00000000-0000-4000-8000-000000000001'
);

insert into public.trip_invitations (
  id, trip_id, email_hash, role, invited_by, token_hash, expires_at
)
values (
  '30000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  encode(digest('rls-invited@andor.invalid', 'sha256'), 'hex'),
  'viewer', '00000000-0000-4000-8000-000000000001',
  encode(digest('andor-test-invitation-token-00000001', 'sha256'), 'hex'),
  now() + interval '2 days'
);

insert into public.trip_imports (
  user_id, idempotency_key, payload_hash, trip_id, status
)
values (
  '00000000-0000-4000-8000-000000000001',
  'rls-import-owner-completed-0001', repeat('d', 64),
  '10000000-0000-4000-8000-000000000001', 'completed'
);
select pg_temp.assert_true(
  (select status = 'completed' and trip_id = '10000000-0000-4000-8000-000000000001'
   from public.trip_imports
   where idempotency_key = 'rls-import-owner-completed-0001'),
  'owner can persist an idempotent completed-import receipt for the owned trip'
);

-- Owner cannot transfer canonical ownership or promote another owner.
select pg_temp.assert_throws(
  $sql$update public.itineraries
       set owner_id = '00000000-0000-4000-8000-000000000002'
       where id = '10000000-0000-4000-8000-000000000001'$sql$,
  'owner_id must be immutable'
);
select pg_temp.assert_throws(
  $sql$update public.trip_members set role = 'owner'
       where trip_id = '10000000-0000-4000-8000-000000000001'
         and user_id = '00000000-0000-4000-8000-000000000002'$sql$,
  'owner cannot create a second owner by role update'
);

-- Editor session: read/write trip content, but no lifecycle, membership or share control.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select pg_temp.assert_true(
  (select count(*) = 1 from public.itineraries
   where id = '10000000-0000-4000-8000-000000000001'),
  'editor must read the trip'
);

update public.itineraries
set itinerary = '{"days":[{"title":"Editor update"}]}'::jsonb
where id = '10000000-0000-4000-8000-000000000001'
  and version = 1;

select pg_temp.assert_true(
  (select version = 2 from public.itineraries
   where id = '10000000-0000-4000-8000-000000000001'),
  'successful editor update must increment version'
);

-- A stale compare-and-swap affects zero rows and preserves the newer document.
update public.itineraries
set itinerary = '{"days":[{"title":"stale overwrite"}]}'::jsonb
where id = '10000000-0000-4000-8000-000000000001'
  and version = 1;
select pg_temp.assert_true(
  (select version = 2 and itinerary #>> '{days,0,title}' = 'Editor update'
   from public.itineraries where id = '10000000-0000-4000-8000-000000000001'),
  'stale version must not overwrite durable content'
);

select pg_temp.assert_throws(
  $sql$update public.itineraries set visibility = 'public'
       where id = '10000000-0000-4000-8000-000000000001'$sql$,
  'editor cannot publish a private trip'
);
select pg_temp.assert_throws(
  $sql$insert into public.trip_share_links
       (trip_id, token_hash, permission, audience, expires_at, created_by)
       values ('10000000-0000-4000-8000-000000000001', repeat('b', 64),
               'viewer', 'client', now() + interval '1 day',
               '00000000-0000-4000-8000-000000000002')$sql$,
  'editor cannot create public share links'
);

-- Self-escalation is filtered by RLS even when it produces no SQL error.
update public.trip_members
set role = 'owner'
where trip_id = '10000000-0000-4000-8000-000000000001'
  and user_id = '00000000-0000-4000-8000-000000000002';

-- Viewer session: read only.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select pg_temp.assert_true(
  (select count(*) = 1 from public.itineraries
   where id = '10000000-0000-4000-8000-000000000001'),
  'viewer must read the trip'
);
update public.itineraries
set itinerary = '{"days":[{"title":"viewer overwrite"}]}'::jsonb
where id = '10000000-0000-4000-8000-000000000001';

-- Outsider session: no trip, member, share, audit or profile enumeration.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000004","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select pg_temp.assert_true(
  (select count(*) = 0 from public.itineraries
   where id = '10000000-0000-4000-8000-000000000001'),
  'outsider cannot read trip'
);
select pg_temp.assert_true(
  (select count(*) = 0 from public.trip_members
   where trip_id = '10000000-0000-4000-8000-000000000001'),
  'outsider cannot enumerate members'
);
select pg_temp.assert_true(
  (select count(*) = 0 from public.trip_share_links
   where trip_id = '10000000-0000-4000-8000-000000000001'),
  'outsider cannot enumerate share metadata'
);
select pg_temp.assert_true(
  (select count(*) = 0 from public.audit_events
   where trip_id = '10000000-0000-4000-8000-000000000001'),
  'outsider cannot read audit events'
);
select pg_temp.assert_true(
  (select count(*) = 0 from public.profiles
   where id = '00000000-0000-4000-8000-000000000001'),
  'outsider cannot read another profile'
);
select pg_temp.assert_throws(
  $sql$insert into public.audit_events (actor_user_id, trip_id, action, resource_type, resource_id)
       values ('00000000-0000-4000-8000-000000000004',
               '10000000-0000-4000-8000-000000000001',
               'audit.forged', 'trip', '10000000-0000-4000-8000-000000000001')$sql$,
  'authenticated clients cannot forge audit events'
);

insert into public.trip_imports (
  user_id, idempotency_key, local_id, payload_hash, status
)
values (
  '00000000-0000-4000-8000-000000000004',
  'rls-import-outsider-0001', 'legacy-trip-1', repeat('c', 64), 'pending'
);
select pg_temp.assert_true(
  (select count(*) = 1 from public.trip_imports
   where idempotency_key = 'rls-import-outsider-0001'),
  'user can read their own pending import receipt'
);
update public.trip_imports
set status = 'imported', completed_at = now()
where idempotency_key = 'rls-import-outsider-0001';
select pg_temp.assert_true(
  (select status = 'pending' from public.trip_imports
   where idempotency_key = 'rls-import-outsider-0001'),
  'client cannot self-confirm a durable import'
);

-- The authenticated invitee cannot mutate membership directly. Acceptance is a
-- single service-role RPC that validates the token/email hashes and owns the
-- member + invitation transaction.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000005","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000005', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select pg_temp.assert_throws(
  $sql$insert into public.trip_members (trip_id, user_id, role, invited_by)
       values ('10000000-0000-4000-8000-000000000001',
               '00000000-0000-4000-8000-000000000005', 'viewer',
               '00000000-0000-4000-8000-000000000001')$sql$,
  'invitee cannot bypass the server acceptance boundary'
);

reset role;
set local role service_role;
select pg_temp.assert_true(
  (select status = 'forbidden'
   from public.accept_trip_invitation_transaction(
     encode(digest('andor-test-invitation-token-00000001', 'sha256'), 'hex'),
     '00000000-0000-4000-8000-000000000005',
     repeat('0', 64)
   )),
  'wrong email fingerprint cannot accept an otherwise valid invitation'
);
select pg_temp.assert_true(
  (select status = 'accepted' and role = 'viewer'
   from public.accept_trip_invitation_transaction(
     encode(digest('andor-test-invitation-token-00000001', 'sha256'), 'hex'),
     '00000000-0000-4000-8000-000000000005',
     encode(digest('rls-invited@andor.invalid', 'sha256'), 'hex')
   )),
  'valid invitation is accepted atomically with its stored role'
);
select pg_temp.assert_true(
  (select status = 'already_accepted'
   from public.accept_trip_invitation_transaction(
     encode(digest('andor-test-invitation-token-00000001', 'sha256'), 'hex'),
     '00000000-0000-4000-8000-000000000005',
     encode(digest('rls-invited@andor.invalid', 'sha256'), 'hex')
   )),
  'repeating acceptance is idempotent'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000005","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000005', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select pg_temp.assert_true(
  (select count(*) = 1 from public.itineraries
   where id = '10000000-0000-4000-8000-000000000001'),
  'accepted invite grants trip visibility'
);
select pg_temp.assert_true(
  (select role = 'viewer' from public.trip_members
   where trip_id = '10000000-0000-4000-8000-000000000001'
     and user_id = '00000000-0000-4000-8000-000000000005'),
  'acceptance cannot elevate the invitation role'
);

-- Owner verifies prior denied mutations, audits, revocation and hard-delete policy.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select pg_temp.assert_throws(
  $sql$select * from public.reserve_generation_request('too-short', repeat('1', 64))$sql$,
  'generation idempotency keys shorter than 16 characters are rejected'
);
select pg_temp.assert_throws(
  $sql$select * from public.reserve_generation_request(
         concat('generation-control-', chr(10), 'key-0001'), repeat('1', 64)
       )$sql$,
  'generation idempotency keys containing control characters are rejected'
);

select pg_temp.assert_true(
  (select itinerary #>> '{days,0,title}' = 'Editor update'
   from public.itineraries where id = '10000000-0000-4000-8000-000000000001'),
  'viewer update must have affected zero rows'
);
select pg_temp.assert_true(
  (select role = 'editor' from public.trip_members
   where trip_id = '10000000-0000-4000-8000-000000000001'
     and user_id = '00000000-0000-4000-8000-000000000002'),
  'editor self-escalation must have affected zero rows'
);
select pg_temp.assert_true(
  (select count(*) >= 4 from public.audit_events
   where trip_id = '10000000-0000-4000-8000-000000000001'),
  'owner must see append-only security audit events'
);

-- RLS blocks owner-member removal; the invariant trigger is a second barrier.
delete from public.trip_members
where trip_id = '10000000-0000-4000-8000-000000000001'
  and user_id = '00000000-0000-4000-8000-000000000001';
select pg_temp.assert_true(
  (select count(*) = 1 from public.trip_members
   where trip_id = '10000000-0000-4000-8000-000000000001'
     and role = 'owner'),
  'last owner membership cannot be deleted'
);

update public.trip_members
set revoked_at = now()
where trip_id = '10000000-0000-4000-8000-000000000001'
  and user_id = '00000000-0000-4000-8000-000000000002';

insert into public.itineraries (
  id, owner_id, destination, itinerary, visibility, status, currency
)
values (
  '10000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'Delete policy fixture', '{"days":[]}'::jsonb, 'private', 'draft', 'EUR'
);
delete from public.itineraries
where id = '10000000-0000-4000-8000-000000000002';
select pg_temp.assert_true(
  (select count(*) = 0 from public.itineraries
   where id = '10000000-0000-4000-8000-000000000002'),
  'owner DELETE policy must remove an owned fixture and cascade memberships'
);

-- Exercise the trigger below RLS as the database owner: even a privileged
-- direct membership DELETE cannot orphan a still-existing itinerary.
reset role;
select pg_temp.assert_throws(
  $sql$delete from public.trip_members
       where trip_id = '10000000-0000-4000-8000-000000000001'
         and user_id = '00000000-0000-4000-8000-000000000001'$sql$,
  'integrity trigger must prevent direct last-owner removal'
);

-- Revoked editor immediately loses visibility.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select pg_temp.assert_true(
  (select count(*) = 0 from public.itineraries
   where id = '10000000-0000-4000-8000-000000000001'),
  'revoked editor must lose access immediately'
);

-- Durable generation idempotency is scoped to auth.uid(). The first caller gets
-- a two-minute lease and all overlapping workers observe in_progress without
-- receiving the active lease token.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select pg_temp.assert_true(
  (select outcome = 'reserved'
          and request_id is not null
          and lease_token is not null
          and lease_expires_at = now() + interval '2 minutes'
          and attempt_count = 1
          and expires_at = now() + interval '24 hours'
   from public.reserve_generation_request(
     'generation-main-key-0001',
     repeat('1', 64)
   )),
  'first generation request must receive a two-minute lease and 24-hour receipt'
);
select pg_temp.assert_true(
  (select outcome = 'in_progress'
          and lease_token is null
          and attempt_count = 1
   from public.reserve_generation_request(
     'generation-main-key-0001',
     repeat('1', 64)
   )),
  'overlapping reservation must not receive the active lease'
);
select pg_temp.assert_true(
  (select outcome = 'hash_mismatch'
          and lease_token is null
          and response is null
   from public.reserve_generation_request(
     'generation-main-key-0001',
     repeat('2', 64)
   )),
  'same idempotency key with a different request hash must fail closed'
);
select pg_temp.assert_true(
  (select count(*) = 1
          and bool_and(user_id = auth.uid())
   from public.generation_requests
   where idempotency_key = 'generation-main-key-0001'),
  'owner-safe SELECT exposes exactly the caller generation receipt'
);
select pg_temp.assert_throws(
  $sql$update public.generation_requests
       set checkpoint = '{"forged":true}'::jsonb
       where idempotency_key = 'generation-main-key-0001'$sql$,
  'authenticated callers cannot update generation state directly'
);

select pg_temp.assert_true(
  (select outcome = 'lease_lost'
   from public.checkpoint_generation_request(
     (select id from public.generation_requests
      where idempotency_key = 'generation-main-key-0001'),
     gen_random_uuid(),
     '{"stage":"provider_complete"}'::jsonb
   )),
  'checkpoint with the wrong lease token must fail closed'
);
select pg_temp.assert_true(
  (select checkpoint = '{}'::jsonb
   from public.generation_requests
   where idempotency_key = 'generation-main-key-0001'),
  'wrong-lease checkpoint must not mutate the durable checkpoint'
);
select pg_temp.assert_true(
  (select outcome = 'checkpointed'
          and checkpoint = '{"stage":"provider_complete"}'::jsonb
          and lease_expires_at = now() + interval '2 minutes'
   from public.checkpoint_generation_request(
     (select id from public.generation_requests
      where idempotency_key = 'generation-main-key-0001'),
     (select lease_token from public.generation_requests
      where idempotency_key = 'generation-main-key-0001'),
     '{"stage":"provider_complete"}'::jsonb
   )),
  'lease holder may persist a checkpoint and renew the two-minute lease'
);

-- Invalid completion leaves both sides untouched, so the same valid lease can
-- retry. A valid completion inserts one itinerary and completes its receipt in
-- the same database transaction.
select pg_temp.assert_true(
  (select outcome = 'invalid_trip'
   from public.complete_generation_request(
     (select id from public.generation_requests
      where idempotency_key = 'generation-main-key-0001'),
     (select lease_token from public.generation_requests
      where idempotency_key = 'generation-main-key-0001'),
     jsonb_build_object(
       'destination', 'Invalid fixture',
       'itinerary', '{"days":[]}'::jsonb,
       'metadata', '{"days":1}'::jsonb,
       'responsePayload', '{}'::jsonb
     )
   )),
  'invalid trip payload must be rejected before persistence'
);
select pg_temp.assert_true(
  (select status = 'pending' and trip_id is null and response is null
   from public.generation_requests
   where idempotency_key = 'generation-main-key-0001')
  and not exists (
    select 1 from public.itineraries where destination = 'Invalid fixture'
  ),
  'rejected completion must leave no partial trip or completed receipt'
);

select pg_temp.assert_true(
  (select outcome = 'completed'
          and trip_id = '10000000-0000-4000-8000-000000000010'
          and response ->> 'id' = '10000000-0000-4000-8000-000000000010'
   from public.complete_generation_request(
     (select id from public.generation_requests
      where idempotency_key = 'generation-main-key-0001'),
     (select lease_token from public.generation_requests
      where idempotency_key = 'generation-main-key-0001'),
     jsonb_build_object(
       'id', '10000000-0000-4000-8000-000000000010',
       'destination', 'Porto, Portugal',
       'itinerary', jsonb_build_object(
         'trip', jsonb_build_object('destination', 'Porto, Portugal'),
         'days', jsonb_build_array(
           jsonb_build_object(
             'day', 1,
             'title', 'Porto essencial',
             'activities', jsonb_build_array(jsonb_build_object('name', 'Ribeira'))
           )
         )
       ),
       'metadata', jsonb_build_object(
         'destinationCity', 'Porto',
         'destinationCountry', 'Portugal',
         'days', 1,
         'style', 'culture',
         'budget', 'moderate',
         'travelers', 2,
         'startDate', '2026-09-10',
         'endDate', '2026-09-10',
         'source', 'generated'
       ),
       'visibility', 'private',
       'status', 'draft',
       'currency', 'EUR',
       'schemaVersion', 1,
       'responsePayload', jsonb_build_object(
         'destination', 'Porto, Portugal',
         'persistence', jsonb_build_object('mode', 'durable')
       )
     )
   )),
  'lease holder completes the itinerary and durable response atomically'
);
select pg_temp.assert_true(
  (select request.status = 'completed'
          and request.trip_id = itinerary.id
          and request.response ->> 'id' = itinerary.id::text
          and request.completed_at is not null
          and request.lease_token is null
          and itinerary.owner_id = auth.uid()
          and itinerary.user_id = auth.uid()
          and itinerary.visibility = 'private'
          and itinerary.status = 'draft'
   from public.generation_requests request
   join public.itineraries itinerary on itinerary.id = request.trip_id
   where request.idempotency_key = 'generation-main-key-0001'),
  'completed receipt and canonical private itinerary must reference each other'
);
select pg_temp.assert_true(
  (select count(*) = 1
   from public.trip_members
   where trip_id = '10000000-0000-4000-8000-000000000010'
     and user_id = auth.uid()
     and role = 'owner'
     and revoked_at is null),
  'atomic completion must preserve the itinerary owner-membership trigger'
);
select pg_temp.assert_true(
  (select outcome = 'already_completed'
          and trip_id = '10000000-0000-4000-8000-000000000010'
          and response ->> 'id' = '10000000-0000-4000-8000-000000000010'
   from public.complete_generation_request(
     (select id from public.generation_requests
      where idempotency_key = 'generation-main-key-0001'),
     gen_random_uuid(),
     '{}'::jsonb
   )),
  'completion replay must return the original result without a live lease'
);
select pg_temp.assert_true(
  (select outcome = 'completed'
          and trip_id = '10000000-0000-4000-8000-000000000010'
          and response ->> 'id' = '10000000-0000-4000-8000-000000000010'
   from public.reserve_generation_request(
     'generation-main-key-0001',
     repeat('1', 64)
   )),
  'reservation replay must return the durable completed response'
);
select pg_temp.assert_true(
  (select outcome = 'already_completed'
          and trip_id = '10000000-0000-4000-8000-000000000010'
          and response ->> 'id' = '10000000-0000-4000-8000-000000000010'
   from public.fail_generation_request(
     (select id from public.generation_requests
      where idempotency_key = 'generation-main-key-0001'),
     gen_random_uuid(),
     'LATE_FAILURE',
     true
   )),
  'late failure racing a completed request must replay the committed receipt'
);
select pg_temp.assert_true(
  (select count(*) = 1 from public.itineraries
   where id = '10000000-0000-4000-8000-000000000010'),
  'completion and replay must insert exactly one itinerary'
);

-- Retryable failures retain their checkpoint and issue a fresh lease with an
-- incremented attempt counter. A terminal failure remains replayable as failed.
select pg_temp.assert_true(
  (select outcome = 'reserved'
   from public.reserve_generation_request(
     'generation-retry-key-0001',
     repeat('3', 64)
   )),
  'retry fixture starts with a reservation'
);
select pg_temp.assert_true(
  (select outcome = 'checkpointed'
   from public.checkpoint_generation_request(
     (select id from public.generation_requests
      where idempotency_key = 'generation-retry-key-0001'),
     (select lease_token from public.generation_requests
      where idempotency_key = 'generation-retry-key-0001'),
     '{"stage":"normalized"}'::jsonb
   )),
  'retry fixture persists a resumable checkpoint'
);
select pg_temp.assert_true(
  (select outcome = 'lease_lost'
   from public.fail_generation_request(
     (select id from public.generation_requests
      where idempotency_key = 'generation-retry-key-0001'),
     gen_random_uuid(),
     'PROVIDER_TIMEOUT',
     true
   )),
  'wrong lease cannot fail another worker generation attempt'
);
select pg_temp.assert_true(
  (select outcome = 'failed' and retryable
   from public.fail_generation_request(
     (select id from public.generation_requests
      where idempotency_key = 'generation-retry-key-0001'),
     (select lease_token from public.generation_requests
      where idempotency_key = 'generation-retry-key-0001'),
     'PROVIDER_TIMEOUT',
     true
   )),
  'lease holder may mark a generation failure retryable'
);
select pg_temp.assert_true(
  (select outcome = 'reserved'
          and attempt_count = 2
          and checkpoint = '{"stage":"normalized"}'::jsonb
          and lease_token is not null
   from public.reserve_generation_request(
     'generation-retry-key-0001',
     repeat('3', 64)
   )),
  'retryable failure must preserve checkpoint and issue a second lease'
);
select pg_temp.assert_true(
  (select outcome = 'failed' and not retryable
   from public.fail_generation_request(
     (select id from public.generation_requests
      where idempotency_key = 'generation-retry-key-0001'),
     (select lease_token from public.generation_requests
      where idempotency_key = 'generation-retry-key-0001'),
     'INVALID_PROVIDER_RESULT',
     false
   )),
  'second attempt can record a terminal generation failure'
);
select pg_temp.assert_true(
  (select outcome = 'failed'
          and attempt_count = 2
          and failure_code = 'INVALID_PROVIDER_RESULT'
          and not retryable
   from public.reserve_generation_request(
     'generation-retry-key-0001',
     repeat('3', 64)
   )),
  'non-retryable failure must not issue another lease'
);

-- A different authenticated identity cannot enumerate or operate on these
-- receipts even when it knows an idempotency key.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000004","role":"authenticated"}',
  true
);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select pg_temp.assert_true(
  (select count(*) = 0 from public.generation_requests),
  'generation receipts are isolated by authenticated owner'
);

-- Anonymous callers cannot read raw trip or link tables. Permission errors are
-- expected because Sprint 1 also revokes table grants from anon.
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select pg_temp.assert_throws(
  $sql$select * from public.itineraries
       where id = '10000000-0000-4000-8000-000000000001'$sql$,
  'anonymous caller cannot read raw itinerary JSON'
);
select pg_temp.assert_throws(
  $sql$select * from public.trip_share_links
       where trip_id = '10000000-0000-4000-8000-000000000001'$sql$,
  'anonymous caller cannot enumerate hashed share links'
);
select pg_temp.assert_throws(
  $sql$select * from public.generation_requests$sql$,
  'anonymous caller cannot enumerate generation receipts'
);
select pg_temp.assert_throws(
  $sql$select * from public.reserve_generation_request(
         'generation-anon-key-0001', repeat('9', 64)
       )$sql$,
  'anonymous caller cannot reserve generation work'
);

reset role;
do $$
begin
  raise notice 'Andor Sprint 1 RLS matrix passed; rolling back all fixtures.';
end;
$$;

rollback;
