-- Durable, multi-instance idempotency for itinerary generation.
--
-- Authenticated callers reserve a short lease before doing expensive work. Only
-- the lease holder may checkpoint, complete or fail the request. Completion
-- inserts the itinerary and commits the replayable response in one transaction.

begin;

create table public.generation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  request_hash text not null,
  status text not null default 'pending',
  attempt_count integer not null default 1,
  lease_token uuid,
  lease_expires_at timestamptz,
  checkpoint jsonb not null default '{}'::jsonb,
  trip_id uuid references public.itineraries(id) on delete set null,
  response jsonb,
  failure_code text,
  retryable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  constraint generation_requests_user_key_key unique (user_id, idempotency_key),
  constraint generation_requests_key_check check (
    char_length(idempotency_key) between 16 and 128
    and idempotency_key = btrim(idempotency_key)
    and idempotency_key !~ '[[:cntrl:]]'
  ),
  constraint generation_requests_hash_check check (request_hash ~ '^[0-9a-f]{64}$'),
  constraint generation_requests_status_check check (
    status in ('pending', 'completed', 'failed')
  ),
  constraint generation_requests_attempt_count_check check (attempt_count > 0),
  constraint generation_requests_checkpoint_check check (jsonb_typeof(checkpoint) = 'object'),
  constraint generation_requests_response_check check (
    response is null or jsonb_typeof(response) = 'object'
  ),
  constraint generation_requests_failure_code_check check (
    failure_code is null
    or (
      char_length(failure_code) between 3 and 80
      and failure_code ~ '^[A-Za-z][A-Za-z0-9_.-]+$'
    )
  ),
  constraint generation_requests_lease_pair_check check (
    (lease_token is null) = (lease_expires_at is null)
  ),
  constraint generation_requests_expiry_check check (expires_at > created_at),
  constraint generation_requests_timestamp_order_check check (
    updated_at >= created_at
    and (completed_at is null or completed_at >= created_at)
    and (failed_at is null or failed_at >= created_at)
  ),
  constraint generation_requests_state_check check (
    (
      status = 'pending'
      and lease_token is not null
      and lease_expires_at is not null
      and trip_id is null
      and response is null
      and failure_code is null
      and completed_at is null
      and failed_at is null
      and retryable
    )
    or (
      status = 'completed'
      and lease_token is null
      and lease_expires_at is null
      and response is not null
      and failure_code is null
      and completed_at is not null
      and failed_at is null
      and not retryable
    )
    or (
      status = 'failed'
      and lease_token is null
      and lease_expires_at is null
      and trip_id is null
      and response is null
      and failure_code is not null
      and completed_at is null
      and failed_at is not null
    )
  )
);

create index generation_requests_user_status_idx
  on public.generation_requests(user_id, status, updated_at desc);
create index generation_requests_pending_lease_idx
  on public.generation_requests(lease_expires_at)
  where status = 'pending';
create index generation_requests_expiry_idx
  on public.generation_requests(expires_at);

alter table public.generation_requests enable row level security;

create policy "generation_requests_select_own" on public.generation_requests
  for select to authenticated
  using (user_id = auth.uid());

-- The table is an RPC-owned state machine. Authenticated callers may inspect
-- only their own receipts and cannot mutate any state directly.
revoke all on table public.generation_requests from public, anon, authenticated;
grant select on table public.generation_requests to authenticated;
grant all on table public.generation_requests to service_role;

create or replace function public.reserve_generation_request(
  p_idempotency_key text,
  p_request_hash text
)
returns table (
  outcome text,
  request_id uuid,
  lease_token uuid,
  lease_expires_at timestamptz,
  attempt_count integer,
  checkpoint jsonb,
  trip_id uuid,
  response jsonb,
  failure_code text,
  retryable boolean,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  request_row public.generation_requests%rowtype;
  operation_time timestamptz := now();
  new_lease uuid := gen_random_uuid();
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_idempotency_key is null
     or char_length(p_idempotency_key) not between 16 and 128
     or p_idempotency_key <> btrim(p_idempotency_key)
     or p_idempotency_key ~ '[[:cntrl:]]' then
    raise exception 'invalid idempotency key' using errcode = '22023';
  end if;
  if p_request_hash is null or p_request_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid request hash' using errcode = '22023';
  end if;

  insert into public.generation_requests (
    user_id,
    idempotency_key,
    request_hash,
    status,
    attempt_count,
    lease_token,
    lease_expires_at,
    checkpoint,
    retryable,
    created_at,
    updated_at,
    expires_at
  ) values (
    actor_id,
    p_idempotency_key,
    p_request_hash,
    'pending',
    1,
    new_lease,
    operation_time + interval '2 minutes',
    '{}'::jsonb,
    true,
    operation_time,
    operation_time,
    operation_time + interval '24 hours'
  )
  on conflict (user_id, idempotency_key) do nothing
  returning * into request_row;

  if found then
    return query select
      'reserved'::text,
      request_row.id,
      request_row.lease_token,
      request_row.lease_expires_at,
      request_row.attempt_count,
      request_row.checkpoint,
      request_row.trip_id,
      request_row.response,
      request_row.failure_code,
      request_row.retryable,
      request_row.expires_at;
    return;
  end if;

  select candidate.* into request_row
  from public.generation_requests candidate
  where candidate.user_id = actor_id
    and candidate.idempotency_key = p_idempotency_key
  for update;

  if not found then
    -- A privileged cleanup racing this reservation removed the expired row.
    -- The transaction can be retried safely with the same idempotency key.
    raise exception 'generation request changed during reservation'
      using errcode = '40001';
  end if;

  if request_row.expires_at <= operation_time then
    update public.generation_requests
    set request_hash = p_request_hash,
        status = 'pending',
        attempt_count = 1,
        lease_token = new_lease,
        lease_expires_at = operation_time + interval '2 minutes',
        checkpoint = '{}'::jsonb,
        trip_id = null,
        response = null,
        failure_code = null,
        retryable = true,
        created_at = operation_time,
        updated_at = operation_time,
        completed_at = null,
        failed_at = null,
        expires_at = operation_time + interval '24 hours'
    where id = request_row.id
    returning * into request_row;

    return query select
      'reserved'::text,
      request_row.id,
      request_row.lease_token,
      request_row.lease_expires_at,
      request_row.attempt_count,
      request_row.checkpoint,
      request_row.trip_id,
      request_row.response,
      request_row.failure_code,
      request_row.retryable,
      request_row.expires_at;
    return;
  end if;

  if request_row.request_hash <> p_request_hash then
    return query select
      'hash_mismatch'::text,
      request_row.id,
      null::uuid,
      null::timestamptz,
      request_row.attempt_count,
      null::jsonb,
      request_row.trip_id,
      null::jsonb,
      null::text,
      false,
      request_row.expires_at;
    return;
  end if;

  if request_row.status = 'completed' then
    return query select
      'completed'::text,
      request_row.id,
      null::uuid,
      null::timestamptz,
      request_row.attempt_count,
      request_row.checkpoint,
      request_row.trip_id,
      request_row.response,
      null::text,
      false,
      request_row.expires_at;
    return;
  end if;

  if request_row.status = 'pending'
     and request_row.lease_expires_at > operation_time then
    return query select
      'in_progress'::text,
      request_row.id,
      null::uuid,
      request_row.lease_expires_at,
      request_row.attempt_count,
      request_row.checkpoint,
      null::uuid,
      null::jsonb,
      null::text,
      true,
      request_row.expires_at;
    return;
  end if;

  if request_row.status = 'failed' and not request_row.retryable then
    return query select
      'failed'::text,
      request_row.id,
      null::uuid,
      null::timestamptz,
      request_row.attempt_count,
      request_row.checkpoint,
      null::uuid,
      null::jsonb,
      request_row.failure_code,
      false,
      request_row.expires_at;
    return;
  end if;

  if request_row.status = 'pending'
     or (request_row.status = 'failed' and request_row.retryable) then
    update public.generation_requests as target
    set status = 'pending',
        attempt_count = target.attempt_count + 1,
        lease_token = new_lease,
        lease_expires_at = least(
          operation_time + interval '2 minutes',
          request_row.expires_at
        ),
        trip_id = null,
        response = null,
        failure_code = null,
        retryable = true,
        updated_at = operation_time,
        completed_at = null,
        failed_at = null
    where id = request_row.id
    returning * into request_row;

    return query select
      'reserved'::text,
      request_row.id,
      request_row.lease_token,
      request_row.lease_expires_at,
      request_row.attempt_count,
      request_row.checkpoint,
      null::uuid,
      null::jsonb,
      null::text,
      true,
      request_row.expires_at;
    return;
  end if;

  raise exception 'invalid generation request state' using errcode = '23514';
end;
$$;

create or replace function public.checkpoint_generation_request(
  p_request_id uuid,
  p_lease_token uuid,
  p_checkpoint jsonb
)
returns table (
  outcome text,
  checkpoint jsonb,
  lease_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  request_row public.generation_requests%rowtype;
  operation_time timestamptz := now();
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_request_id is null or p_lease_token is null then
    raise exception 'request id and lease token are required' using errcode = '22023';
  end if;
  if p_checkpoint is null or jsonb_typeof(p_checkpoint) <> 'object' then
    raise exception 'checkpoint must be a JSON object' using errcode = '22023';
  end if;

  select candidate.* into request_row
  from public.generation_requests candidate
  where candidate.id = p_request_id
    and candidate.user_id = actor_id
  for update;

  if not found then
    return query select 'not_found'::text, null::jsonb, null::timestamptz;
    return;
  end if;

  if request_row.status <> 'pending'
     or request_row.lease_token <> p_lease_token
     or request_row.lease_expires_at <= operation_time
     or request_row.expires_at <= operation_time then
    return query select 'lease_lost'::text, null::jsonb, null::timestamptz;
    return;
  end if;

  update public.generation_requests
  set checkpoint = p_checkpoint,
      lease_expires_at = least(
        operation_time + interval '2 minutes',
        request_row.expires_at
      ),
      updated_at = operation_time
  where id = request_row.id
  returning * into request_row;

  return query select
    'checkpointed'::text,
    request_row.checkpoint,
    request_row.lease_expires_at;
end;
$$;

create or replace function public.complete_generation_request(
  p_request_id uuid,
  p_lease_token uuid,
  p_trip_record jsonb
)
returns table (
  outcome text,
  trip_id uuid,
  response jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  request_row public.generation_requests%rowtype;
  operation_time timestamptz := now();
  trip_document jsonb;
  trip_metadata jsonb;
  response_payload jsonb;
  stored_response jsonb;
  requested_trip_id uuid := gen_random_uuid();
  created_trip_id uuid;
  destination_value text;
  destination_city_value text;
  destination_country_value text;
  days_count_value integer;
  style_value text;
  budget_value text;
  travelers_value integer;
  start_date_value date;
  end_date_value date;
  source_value text;
  currency_value text;
  schema_version_value integer;
  raw_value text;
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_request_id is null or p_lease_token is null then
    raise exception 'request id and lease token are required' using errcode = '22023';
  end if;

  select candidate.* into request_row
  from public.generation_requests candidate
  where candidate.id = p_request_id
    and candidate.user_id = actor_id
  for update;

  if not found then
    return query select 'not_found'::text, null::uuid, null::jsonb;
    return;
  end if;

  -- Completion replay no longer depends on a live lease. This is the response
  -- recovery path when the first transaction committed but its HTTP response was
  -- lost.
  if request_row.status = 'completed' then
    return query select
      'already_completed'::text,
      request_row.trip_id,
      request_row.response;
    return;
  end if;

  if request_row.status <> 'pending'
     or request_row.lease_token <> p_lease_token
     or request_row.lease_expires_at <= operation_time
     or request_row.expires_at <= operation_time then
    return query select 'lease_lost'::text, null::uuid, null::jsonb;
    return;
  end if;

  if p_trip_record is null
     or jsonb_typeof(p_trip_record) <> 'object'
     or jsonb_typeof(p_trip_record -> 'itinerary') <> 'object'
     or jsonb_typeof(p_trip_record -> 'metadata') <> 'object'
     or jsonb_typeof(p_trip_record -> 'responsePayload') <> 'object' then
    return query select 'invalid_trip'::text, null::uuid, null::jsonb;
    return;
  end if;

  trip_document := p_trip_record -> 'itinerary';
  trip_metadata := p_trip_record -> 'metadata';
  response_payload := p_trip_record -> 'responsePayload';
  destination_value := nullif(btrim(p_trip_record ->> 'destination'), '');

  if destination_value is null
     or char_length(destination_value) > 300
     or jsonb_typeof(trip_document -> 'days') <> 'array'
     or jsonb_array_length(trip_document -> 'days') < 1
     or coalesce(p_trip_record ->> 'visibility', 'private') <> 'private'
     or coalesce(p_trip_record ->> 'status', 'draft') <> 'draft' then
    return query select 'invalid_trip'::text, null::uuid, null::jsonb;
    return;
  end if;

  if p_trip_record ? 'id' then
    raw_value := p_trip_record ->> 'id';
    if raw_value is null
       or raw_value !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      return query select 'invalid_trip'::text, null::uuid, null::jsonb;
      return;
    end if;
    requested_trip_id := raw_value::uuid;
  end if;

  days_count_value := jsonb_array_length(trip_document -> 'days');
  raw_value := trip_metadata ->> 'days';
  if raw_value is not null then
    if raw_value !~ '^[1-9][0-9]{0,5}$'
       or raw_value::integer <> days_count_value then
      return query select 'invalid_trip'::text, null::uuid, null::jsonb;
      return;
    end if;
  end if;

  raw_value := trip_metadata ->> 'travelers';
  if raw_value is not null then
    if raw_value !~ '^[1-9][0-9]{0,5}$' then
      return query select 'invalid_trip'::text, null::uuid, null::jsonb;
      return;
    end if;
    travelers_value := raw_value::integer;
  end if;

  raw_value := coalesce(p_trip_record ->> 'schemaVersion', '1');
  if raw_value !~ '^[1-9][0-9]{0,8}$' then
    return query select 'invalid_trip'::text, null::uuid, null::jsonb;
    return;
  end if;
  schema_version_value := raw_value::integer;

  currency_value := upper(coalesce(nullif(btrim(p_trip_record ->> 'currency'), ''), 'EUR'));
  if currency_value !~ '^[A-Z]{3}$' then
    return query select 'invalid_trip'::text, null::uuid, null::jsonb;
    return;
  end if;

  destination_city_value := nullif(btrim(trip_metadata ->> 'destinationCity'), '');
  destination_country_value := nullif(btrim(trip_metadata ->> 'destinationCountry'), '');
  style_value := nullif(btrim(trip_metadata ->> 'style'), '');
  budget_value := nullif(btrim(trip_metadata ->> 'budget'), '');
  source_value := coalesce(nullif(btrim(trip_metadata ->> 'source'), ''), 'generated');

  if char_length(coalesce(destination_city_value, '')) > 200
     or char_length(coalesce(destination_country_value, '')) > 200
     or char_length(coalesce(style_value, '')) > 100
     or char_length(coalesce(budget_value, '')) > 100
     or char_length(source_value) > 80 then
    return query select 'invalid_trip'::text, null::uuid, null::jsonb;
    return;
  end if;

  begin
    raw_value := nullif(btrim(trip_metadata ->> 'startDate'), '');
    if raw_value is not null then
      if raw_value !~ '^\d{4}-\d{2}-\d{2}$' then
        raise invalid_datetime_format;
      end if;
      start_date_value := raw_value::date;
    end if;

    raw_value := nullif(btrim(trip_metadata ->> 'endDate'), '');
    if raw_value is not null then
      if raw_value !~ '^\d{4}-\d{2}-\d{2}$' then
        raise invalid_datetime_format;
      end if;
      end_date_value := raw_value::date;
    end if;
  exception
    when invalid_datetime_format or datetime_field_overflow then
      return query select 'invalid_trip'::text, null::uuid, null::jsonb;
      return;
  end;

  if start_date_value is not null
     and end_date_value is not null
     and end_date_value < start_date_value then
    return query select 'invalid_trip'::text, null::uuid, null::jsonb;
    return;
  end if;

  begin
    insert into public.itineraries (
      id,
      owner_id,
      user_id,
      destination,
      destination_city,
      destination_country,
      days_count,
      style,
      budget_tier,
      travelers,
      start_date,
      end_date,
      itinerary,
      source,
      visibility,
      status,
      currency,
      schema_version
    ) values (
      requested_trip_id,
      actor_id,
      actor_id,
      destination_value,
      destination_city_value,
      destination_country_value,
      days_count_value,
      style_value,
      budget_value,
      travelers_value,
      start_date_value,
      end_date_value,
      trip_document,
      source_value,
      'private',
      'draft',
      currency_value,
      schema_version_value
    )
    returning id into created_trip_id;
  exception
    when unique_violation or check_violation or not_null_violation then
      return query select 'invalid_trip'::text, null::uuid, null::jsonb;
      return;
  end;

  stored_response := response_payload || jsonb_build_object('id', created_trip_id);

  update public.generation_requests
  set status = 'completed',
      lease_token = null,
      lease_expires_at = null,
      trip_id = created_trip_id,
      response = stored_response,
      failure_code = null,
      retryable = false,
      updated_at = operation_time,
      completed_at = operation_time,
      failed_at = null
  where id = request_row.id;

  return query select 'completed'::text, created_trip_id, stored_response;
end;
$$;

create or replace function public.fail_generation_request(
  p_request_id uuid,
  p_lease_token uuid,
  p_failure_code text,
  p_retryable boolean
)
returns table (
  outcome text,
  retryable boolean,
  checkpoint jsonb,
  trip_id uuid,
  response jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  request_row public.generation_requests%rowtype;
  operation_time timestamptz := now();
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_request_id is null or p_lease_token is null then
    raise exception 'request id and lease token are required' using errcode = '22023';
  end if;
  if p_failure_code is null
     or char_length(p_failure_code) not between 3 and 80
     or p_failure_code !~ '^[A-Za-z][A-Za-z0-9_.-]+$'
     or p_retryable is null then
    raise exception 'invalid failure state' using errcode = '22023';
  end if;

  select candidate.* into request_row
  from public.generation_requests candidate
  where candidate.id = p_request_id
    and candidate.user_id = actor_id
  for update;

  if not found then
    return query select
      'not_found'::text, false, null::jsonb, null::uuid, null::jsonb;
    return;
  end if;

  if request_row.status = 'completed' then
    return query select
      'already_completed'::text,
      false,
      request_row.checkpoint,
      request_row.trip_id,
      request_row.response;
    return;
  end if;

  if request_row.status <> 'pending'
     or request_row.lease_token <> p_lease_token
     or request_row.lease_expires_at <= operation_time
     or request_row.expires_at <= operation_time then
    return query select
      'lease_lost'::text,
      request_row.retryable,
      request_row.checkpoint,
      request_row.trip_id,
      request_row.response;
    return;
  end if;

  update public.generation_requests
  set status = 'failed',
      lease_token = null,
      lease_expires_at = null,
      trip_id = null,
      response = null,
      failure_code = p_failure_code,
      retryable = p_retryable,
      updated_at = operation_time,
      completed_at = null,
      failed_at = operation_time
  where id = request_row.id;

  return query select
    'failed'::text,
    p_retryable,
    request_row.checkpoint,
    null::uuid,
    null::jsonb;
end;
$$;

revoke all on function public.reserve_generation_request(text, text)
  from public, anon, authenticated;
revoke all on function public.checkpoint_generation_request(uuid, uuid, jsonb)
  from public, anon, authenticated;
revoke all on function public.complete_generation_request(uuid, uuid, jsonb)
  from public, anon, authenticated;
revoke all on function public.fail_generation_request(uuid, uuid, text, boolean)
  from public, anon, authenticated;

grant execute on function public.reserve_generation_request(text, text)
  to authenticated;
grant execute on function public.checkpoint_generation_request(uuid, uuid, jsonb)
  to authenticated;
grant execute on function public.complete_generation_request(uuid, uuid, jsonb)
  to authenticated;
grant execute on function public.fail_generation_request(uuid, uuid, text, boolean)
  to authenticated;

commit;
