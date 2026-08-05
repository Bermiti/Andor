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

reset role;
do $$
begin
  raise notice 'Andor Sprint 1 RLS matrix passed; rolling back all fixtures.';
end;
$$;

rollback;
