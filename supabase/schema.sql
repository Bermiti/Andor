


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "private"."current_audit_actor"() RETURNS "uuid"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO ''
    AS $_$
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
$_$;


ALTER FUNCTION "private"."current_audit_actor"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_trip_invitation_transaction"("p_token_hash" "text", "p_user_id" "uuid", "p_email_hash" "text") RETURNS TABLE("status" "text", "trip_id" "uuid", "role" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
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
$_$;


ALTER FUNCTION "public"."accept_trip_invitation_transaction"("p_token_hash" "text", "p_user_id" "uuid", "p_email_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_invitation_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."audit_invitation_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_itinerary_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."audit_itinerary_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_membership_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."audit_membership_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_share_link_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."audit_share_link_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."canonicalize_trip_ledger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
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
$_$;


ALTER FUNCTION "public"."canonicalize_trip_ledger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."checkpoint_generation_request"("p_request_id" "uuid", "p_lease_token" "uuid", "p_checkpoint" "jsonb") RETURNS TABLE("outcome" "text", "checkpoint" "jsonb", "lease_expires_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."checkpoint_generation_request"("p_request_id" "uuid", "p_lease_token" "uuid", "p_checkpoint" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_generation_request"("p_request_id" "uuid", "p_lease_token" "uuid", "p_trip_record" "jsonb") RETURNS TABLE("outcome" "text", "trip_id" "uuid", "response" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
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
$_$;


ALTER FUNCTION "public"."complete_generation_request"("p_request_id" "uuid", "p_lease_token" "uuid", "p_trip_record" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_has_trip_role"("p_trip_id" "uuid", "p_roles" "text"[] DEFAULT ARRAY['owner'::"text", 'editor'::"text", 'viewer'::"text"]) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  select exists (
    select 1
    from public.trip_members member
    where member.trip_id = p_trip_id
      and member.user_id = auth.uid()
      and member.revoked_at is null
      and member.role = any(p_roles)
  );
$$;


ALTER FUNCTION "public"."current_user_has_trip_role"("p_trip_id" "uuid", "p_roles" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_owns_trip"("p_trip_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  select exists (
    select 1
    from public.itineraries itinerary
    where itinerary.id = p_trip_id
      and itinerary.owner_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."current_user_owns_trip"("p_trip_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_itinerary_invariants"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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
        new.status := 'draft';
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
    new.status := 'draft';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."enforce_itinerary_invariants"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_trip_invitation_client_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."enforce_trip_invitation_client_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_trip_member_invariants"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."enforce_trip_member_invariants"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_trip_share_client_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."enforce_trip_share_client_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_itinerary_owner_membership"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."ensure_itinerary_owner_membership"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fail_generation_request"("p_request_id" "uuid", "p_lease_token" "uuid", "p_failure_code" "text", "p_retryable" boolean) RETURNS TABLE("outcome" "text", "retryable" boolean, "checkpoint" "jsonb", "trip_id" "uuid", "response" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
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
$_$;


ALTER FUNCTION "public"."fail_generation_request"("p_request_id" "uuid", "p_lease_token" "uuid", "p_failure_code" "text", "p_retryable" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."handle_new_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_audit_event"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."normalize_audit_event"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_owner_membership_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  if old.role = 'owner'
     and exists (select 1 from public.itineraries where id = old.trip_id) then
    raise exception 'last owner membership cannot be removed'
      using errcode = '42501';
  end if;
  return old;
end;
$$;


ALTER FUNCTION "public"."prevent_owner_membership_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_trip_audit_event"("p_trip_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."record_trip_audit_event"("p_trip_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reserve_generation_request"("p_idempotency_key" "text", "p_request_hash" "text") RETURNS TABLE("outcome" "text", "request_id" "uuid", "lease_token" "uuid", "lease_expires_at" timestamp with time zone, "attempt_count" integer, "checkpoint" "jsonb", "trip_id" "uuid", "response" "jsonb", "failure_code" "text", "retryable" boolean, "expires_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
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
$_$;


ALTER FUNCTION "public"."reserve_generation_request"("p_idempotency_key" "text", "p_request_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_row_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_row_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."audit_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_user_id" "uuid",
    "trip_id" "uuid",
    "action" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_id" "uuid" NOT NULL,
    "correlation_id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "audit_events_action_check" CHECK (("action" ~ '^[a-z][a-z0-9_.-]{2,79}$'::"text")),
    CONSTRAINT "audit_events_metadata_object_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "audit_events_resource_type_check" CHECK (("resource_type" ~ '^[a-z][a-z0-9_.-]{1,39}$'::"text"))
);


ALTER TABLE "public"."audit_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "destination" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "budget" numeric,
    "travelers" "text",
    "notes" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."custom_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."generation_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "idempotency_key" "text" NOT NULL,
    "request_hash" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "attempt_count" integer DEFAULT 1 NOT NULL,
    "lease_token" "uuid",
    "lease_expires_at" timestamp with time zone,
    "checkpoint" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "trip_id" "uuid",
    "response" "jsonb",
    "failure_code" "text",
    "retryable" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "failed_at" timestamp with time zone,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '24:00:00'::interval) NOT NULL,
    CONSTRAINT "generation_requests_attempt_count_check" CHECK (("attempt_count" > 0)),
    CONSTRAINT "generation_requests_checkpoint_check" CHECK (("jsonb_typeof"("checkpoint") = 'object'::"text")),
    CONSTRAINT "generation_requests_expiry_check" CHECK (("expires_at" > "created_at")),
    CONSTRAINT "generation_requests_failure_code_check" CHECK ((("failure_code" IS NULL) OR ((("char_length"("failure_code") >= 3) AND ("char_length"("failure_code") <= 80)) AND ("failure_code" ~ '^[A-Za-z][A-Za-z0-9_.-]+$'::"text")))),
    CONSTRAINT "generation_requests_hash_check" CHECK (("request_hash" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "generation_requests_key_check" CHECK (((("char_length"("idempotency_key") >= 16) AND ("char_length"("idempotency_key") <= 128)) AND ("idempotency_key" = "btrim"("idempotency_key")) AND ("idempotency_key" !~ '[[:cntrl:]]'::"text"))),
    CONSTRAINT "generation_requests_lease_pair_check" CHECK ((("lease_token" IS NULL) = ("lease_expires_at" IS NULL))),
    CONSTRAINT "generation_requests_response_check" CHECK ((("response" IS NULL) OR ("jsonb_typeof"("response") = 'object'::"text"))),
    CONSTRAINT "generation_requests_state_check" CHECK (((("status" = 'pending'::"text") AND ("lease_token" IS NOT NULL) AND ("lease_expires_at" IS NOT NULL) AND ("trip_id" IS NULL) AND ("response" IS NULL) AND ("failure_code" IS NULL) AND ("completed_at" IS NULL) AND ("failed_at" IS NULL) AND "retryable") OR (("status" = 'completed'::"text") AND ("lease_token" IS NULL) AND ("lease_expires_at" IS NULL) AND ("response" IS NOT NULL) AND ("failure_code" IS NULL) AND ("completed_at" IS NOT NULL) AND ("failed_at" IS NULL) AND (NOT "retryable")) OR (("status" = 'failed'::"text") AND ("lease_token" IS NULL) AND ("lease_expires_at" IS NULL) AND ("trip_id" IS NULL) AND ("response" IS NULL) AND ("failure_code" IS NOT NULL) AND ("completed_at" IS NULL) AND ("failed_at" IS NOT NULL)))),
    CONSTRAINT "generation_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text"]))),
    CONSTRAINT "generation_requests_timestamp_order_check" CHECK ((("updated_at" >= "created_at") AND (("completed_at" IS NULL) OR ("completed_at" >= "created_at")) AND (("failed_at" IS NULL) OR ("failed_at" >= "created_at"))))
);


ALTER TABLE "public"."generation_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."itineraries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "owner_key" "text",
    "destination" "text" NOT NULL,
    "destination_city" "text",
    "destination_country" "text",
    "days_count" integer DEFAULT 0 NOT NULL,
    "style" "text",
    "budget_tier" "text",
    "travelers" integer,
    "start_date" "date",
    "end_date" "date",
    "share_token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "itinerary" "jsonb" NOT NULL,
    "source" "text" DEFAULT 'generated'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "owner_id" "uuid",
    "visibility" "text" DEFAULT 'private'::"text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "currency" "text" DEFAULT 'EUR'::"text" NOT NULL,
    "schema_version" integer DEFAULT 1 NOT NULL,
    "version" bigint DEFAULT 1 NOT NULL,
    "deleted_at" timestamp with time zone,
    "legacy_quarantined_at" timestamp with time zone,
    CONSTRAINT "itineraries_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "itineraries_owner_state_check" CHECK (((("owner_id" IS NULL) AND ("status" = 'legacy_pending'::"text") AND ("legacy_quarantined_at" IS NOT NULL)) OR (("owner_id" IS NOT NULL) AND ("status" <> 'legacy_pending'::"text")))),
    CONSTRAINT "itineraries_schema_version_check" CHECK (("schema_version" >= 1)),
    CONSTRAINT "itineraries_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'archived'::"text", 'deleted'::"text", 'legacy_pending'::"text"]))),
    CONSTRAINT "itineraries_version_check" CHECK (("version" >= 1)),
    CONSTRAINT "itineraries_visibility_check" CHECK (("visibility" = ANY (ARRAY['private'::"text", 'unlisted'::"text", 'public'::"text"])))
);


ALTER TABLE "public"."itineraries" OWNER TO "postgres";


COMMENT ON COLUMN "public"."itineraries"."user_id" IS 'Deprecated compatibility mirror of owner_id. Do not use for authorization.';



COMMENT ON COLUMN "public"."itineraries"."owner_key" IS 'Deprecated legacy identity key. Quarantined compatibility data; never an authorization source.';



COMMENT ON COLUMN "public"."itineraries"."share_token" IS 'Deprecated raw token. New links use trip_share_links.token_hash; do not expose this value.';



COMMENT ON COLUMN "public"."itineraries"."owner_id" IS 'Canonical owner. The server must derive this from auth.uid(); never from request JSON.';



COMMENT ON COLUMN "public"."itineraries"."version" IS 'Optimistic concurrency version. Update with WHERE version = expected_version.';



CREATE TABLE IF NOT EXISTS "public"."itinerary_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_key" "text" NOT NULL,
    "owner_key" "text" NOT NULL,
    "token_hash" "text" NOT NULL,
    "audience" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_accessed_at" timestamp with time zone,
    "legacy_quarantined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "itinerary_shares_audience_check" CHECK (("audience" = ANY (ARRAY['client'::"text", 'internal'::"text"])))
);


ALTER TABLE "public"."itinerary_shares" OWNER TO "postgres";


COMMENT ON TABLE "public"."itinerary_shares" IS 'Deprecated payload snapshots. Service-only quarantine; new links belong in trip_share_links.';



CREATE TABLE IF NOT EXISTS "public"."itinerary_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "itinerary_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "label" "text" NOT NULL,
    "itinerary" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "version" bigint DEFAULT 1 NOT NULL
);


ALTER TABLE "public"."itinerary_versions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."itinerary_versions"."user_id" IS 'Deprecated compatibility actor. Authorization follows itinerary membership.';



CREATE TABLE IF NOT EXISTS "public"."newsletter_subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "source" "text" DEFAULT 'newsletter_popup'::"text",
    "locale" "text" DEFAULT 'pt'::"text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."newsletter_subscribers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "bio" "text" DEFAULT ''::"text",
    "interests" "text"[] DEFAULT ARRAY[]::"text"[],
    "visited_countries" "text"[] DEFAULT ARRAY[]::"text"[],
    "looking_for_buddy" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_imports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "idempotency_key" "text" NOT NULL,
    "local_id" "text",
    "payload_hash" "text" NOT NULL,
    "trip_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "conflict_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "trip_imports_completion_check" CHECK (((("status" = 'pending'::"text") AND ("completed_at" IS NULL)) OR ("status" <> 'pending'::"text"))),
    CONSTRAINT "trip_imports_idempotency_key_check" CHECK ((("char_length"("idempotency_key") >= 8) AND ("char_length"("idempotency_key") <= 200))),
    CONSTRAINT "trip_imports_local_id_check" CHECK ((("local_id" IS NULL) OR (("char_length"("local_id") >= 1) AND ("char_length"("local_id") <= 200)))),
    CONSTRAINT "trip_imports_payload_hash_check" CHECK (("payload_hash" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "trip_imports_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'conflict'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."trip_imports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "email_hash" "text" NOT NULL,
    "role" "text" NOT NULL,
    "token_hash" "text" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "accepted_at" timestamp with time zone,
    "accepted_by" "uuid",
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "trip_invitations_email_hash_check" CHECK ((("email_hash" IS NULL) OR ("email_hash" ~ '^[0-9a-f]{64}$'::"text"))),
    CONSTRAINT "trip_invitations_expiry_check" CHECK (("expires_at" > "created_at")),
    CONSTRAINT "trip_invitations_role_check" CHECK (("role" = ANY (ARRAY['editor'::"text", 'viewer'::"text"]))),
    CONSTRAINT "trip_invitations_terminal_state_check" CHECK ((NOT (("accepted_at" IS NOT NULL) AND ("revoked_at" IS NOT NULL)))),
    CONSTRAINT "trip_invitations_token_hash_check" CHECK (("token_hash" ~ '^[0-9a-f]{64}$'::"text"))
);


ALTER TABLE "public"."trip_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_ledgers" (
    "trip_key" "text" NOT NULL,
    "owner_key" "text" NOT NULL,
    "ledger" "jsonb" DEFAULT '{"expenses": [], "participants": []}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "itinerary_id" "uuid",
    "version" bigint DEFAULT 1 NOT NULL,
    "legacy_quarantined_at" timestamp with time zone,
    CONSTRAINT "trip_ledgers_version_check" CHECK (("version" >= 1))
);


ALTER TABLE "public"."trip_ledgers" OWNER TO "postgres";


COMMENT ON COLUMN "public"."trip_ledgers"."trip_key" IS 'Deprecated compatibility key. Canonical authorization uses itinerary_id.';



COMMENT ON COLUMN "public"."trip_ledgers"."owner_key" IS 'Deprecated compatibility key. Never use for authorization.';



CREATE TABLE IF NOT EXISTS "public"."trip_members" (
    "trip_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "invited_by" "uuid",
    "accepted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "trip_members_owner_active_check" CHECK ((("role" <> 'owner'::"text") OR ("revoked_at" IS NULL))),
    CONSTRAINT "trip_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'editor'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."trip_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_share_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "token_hash" "text" NOT NULL,
    "permission" "text" DEFAULT 'viewer'::"text" NOT NULL,
    "audience" "text" DEFAULT 'client'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "revoked_at" timestamp with time zone,
    "max_uses" integer,
    "use_count" integer DEFAULT 0 NOT NULL,
    "last_accessed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "trip_share_links_audience_check" CHECK (("audience" = ANY (ARRAY['client'::"text", 'internal'::"text"]))),
    CONSTRAINT "trip_share_links_expiry_check" CHECK (("expires_at" > "created_at")),
    CONSTRAINT "trip_share_links_max_uses_check" CHECK ((("max_uses" IS NULL) OR ("max_uses" > 0))),
    CONSTRAINT "trip_share_links_permission_check" CHECK (("permission" = 'viewer'::"text")),
    CONSTRAINT "trip_share_links_token_hash_check" CHECK (("token_hash" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "trip_share_links_use_count_check" CHECK (("use_count" >= 0)),
    CONSTRAINT "trip_share_links_use_limit_check" CHECK ((("max_uses" IS NULL) OR ("use_count" <= "max_uses")))
);


ALTER TABLE "public"."trip_share_links" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_events"
    ADD CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_requests"
    ADD CONSTRAINT "custom_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generation_requests"
    ADD CONSTRAINT "generation_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generation_requests"
    ADD CONSTRAINT "generation_requests_user_key_key" UNIQUE ("user_id", "idempotency_key");



ALTER TABLE ONLY "public"."itineraries"
    ADD CONSTRAINT "itineraries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."itinerary_shares"
    ADD CONSTRAINT "itinerary_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."itinerary_shares"
    ADD CONSTRAINT "itinerary_shares_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."itinerary_versions"
    ADD CONSTRAINT "itinerary_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter_subscribers"
    ADD CONSTRAINT "newsletter_subscribers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."newsletter_subscribers"
    ADD CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_imports"
    ADD CONSTRAINT "trip_imports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_imports"
    ADD CONSTRAINT "trip_imports_user_id_idempotency_key_key" UNIQUE ("user_id", "idempotency_key");



ALTER TABLE ONLY "public"."trip_invitations"
    ADD CONSTRAINT "trip_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_invitations"
    ADD CONSTRAINT "trip_invitations_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."trip_ledgers"
    ADD CONSTRAINT "trip_ledgers_pkey" PRIMARY KEY ("trip_key", "owner_key");



ALTER TABLE ONLY "public"."trip_members"
    ADD CONSTRAINT "trip_members_pkey" PRIMARY KEY ("trip_id", "user_id");



ALTER TABLE ONLY "public"."trip_share_links"
    ADD CONSTRAINT "trip_share_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_share_links"
    ADD CONSTRAINT "trip_share_links_token_hash_key" UNIQUE ("token_hash");



CREATE INDEX "audit_events_actor_created_idx" ON "public"."audit_events" USING "btree" ("actor_user_id", "created_at" DESC);



CREATE INDEX "audit_events_trip_created_idx" ON "public"."audit_events" USING "btree" ("trip_id", "created_at" DESC);



CREATE INDEX "generation_requests_expiry_idx" ON "public"."generation_requests" USING "btree" ("expires_at");



CREATE INDEX "generation_requests_pending_lease_idx" ON "public"."generation_requests" USING "btree" ("lease_expires_at") WHERE ("status" = 'pending'::"text");



CREATE INDEX "generation_requests_user_status_idx" ON "public"."generation_requests" USING "btree" ("user_id", "status", "updated_at" DESC);



CREATE INDEX "itineraries_legacy_quarantine_idx" ON "public"."itineraries" USING "btree" ("legacy_quarantined_at") WHERE ("owner_id" IS NULL);



CREATE INDEX "itineraries_owner_updated_idx" ON "public"."itineraries" USING "btree" ("owner_id", "updated_at" DESC) WHERE (("owner_id" IS NOT NULL) AND ("deleted_at" IS NULL));



CREATE UNIQUE INDEX "itineraries_share_token_idx" ON "public"."itineraries" USING "btree" ("share_token");



CREATE INDEX "itineraries_user_id_created_at_idx" ON "public"."itineraries" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "itinerary_shares_expiry_idx" ON "public"."itinerary_shares" USING "btree" ("expires_at") WHERE ("revoked_at" IS NULL);



CREATE INDEX "itinerary_shares_owner_source_idx" ON "public"."itinerary_shares" USING "btree" ("owner_key", "source_key", "created_at" DESC);



CREATE UNIQUE INDEX "itinerary_versions_trip_version_idx" ON "public"."itinerary_versions" USING "btree" ("itinerary_id", "version");



CREATE INDEX "trip_imports_user_created_idx" ON "public"."trip_imports" USING "btree" ("user_id", "created_at" DESC);



CREATE UNIQUE INDEX "trip_imports_user_local_hash_idx" ON "public"."trip_imports" USING "btree" ("user_id", "local_id", "payload_hash") WHERE ("local_id" IS NOT NULL);



CREATE INDEX "trip_invitations_active_idx" ON "public"."trip_invitations" USING "btree" ("expires_at") WHERE (("accepted_at" IS NULL) AND ("revoked_at" IS NULL));



CREATE INDEX "trip_invitations_trip_created_idx" ON "public"."trip_invitations" USING "btree" ("trip_id", "created_at" DESC);



CREATE UNIQUE INDEX "trip_ledgers_itinerary_idx" ON "public"."trip_ledgers" USING "btree" ("itinerary_id") WHERE ("itinerary_id" IS NOT NULL);



CREATE INDEX "trip_ledgers_owner_updated_idx" ON "public"."trip_ledgers" USING "btree" ("owner_key", "updated_at" DESC);



CREATE INDEX "trip_members_user_active_idx" ON "public"."trip_members" USING "btree" ("user_id", "updated_at" DESC) WHERE ("revoked_at" IS NULL);



CREATE INDEX "trip_share_links_active_idx" ON "public"."trip_share_links" USING "btree" ("expires_at") WHERE ("revoked_at" IS NULL);



CREATE INDEX "trip_share_links_trip_created_idx" ON "public"."trip_share_links" USING "btree" ("trip_id", "created_at" DESC);



CREATE OR REPLACE TRIGGER "audit_events_normalize" BEFORE INSERT ON "public"."audit_events" FOR EACH ROW EXECUTE FUNCTION "public"."normalize_audit_event"();



CREATE OR REPLACE TRIGGER "itineraries_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."itineraries" FOR EACH ROW EXECUTE FUNCTION "public"."audit_itinerary_change"();



CREATE OR REPLACE TRIGGER "itineraries_enforce_invariants" BEFORE INSERT OR UPDATE ON "public"."itineraries" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_itinerary_invariants"();



CREATE OR REPLACE TRIGGER "itineraries_ensure_owner_membership" AFTER INSERT OR UPDATE OF "owner_id" ON "public"."itineraries" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_itinerary_owner_membership"();



CREATE OR REPLACE TRIGGER "profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_row_updated_at"();



CREATE OR REPLACE TRIGGER "trip_imports_set_updated_at" BEFORE UPDATE ON "public"."trip_imports" FOR EACH ROW EXECUTE FUNCTION "public"."set_row_updated_at"();



CREATE OR REPLACE TRIGGER "trip_invitations_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."trip_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."audit_invitation_change"();



CREATE OR REPLACE TRIGGER "trip_invitations_enforce_client_update" BEFORE INSERT OR UPDATE ON "public"."trip_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_trip_invitation_client_update"();



CREATE OR REPLACE TRIGGER "trip_invitations_set_updated_at" BEFORE UPDATE ON "public"."trip_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."set_row_updated_at"();



CREATE OR REPLACE TRIGGER "trip_ledgers_canonicalize" BEFORE INSERT OR UPDATE ON "public"."trip_ledgers" FOR EACH ROW EXECUTE FUNCTION "public"."canonicalize_trip_ledger"();



CREATE OR REPLACE TRIGGER "trip_members_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."trip_members" FOR EACH ROW EXECUTE FUNCTION "public"."audit_membership_change"();



CREATE OR REPLACE TRIGGER "trip_members_enforce_invariants" BEFORE INSERT OR UPDATE ON "public"."trip_members" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_trip_member_invariants"();



CREATE OR REPLACE TRIGGER "trip_members_prevent_owner_delete" BEFORE DELETE ON "public"."trip_members" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_owner_membership_delete"();



CREATE OR REPLACE TRIGGER "trip_share_links_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."trip_share_links" FOR EACH ROW EXECUTE FUNCTION "public"."audit_share_link_change"();



CREATE OR REPLACE TRIGGER "trip_share_links_enforce_client_update" BEFORE UPDATE ON "public"."trip_share_links" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_trip_share_client_update"();



CREATE OR REPLACE TRIGGER "trip_share_links_set_updated_at" BEFORE UPDATE ON "public"."trip_share_links" FOR EACH ROW EXECUTE FUNCTION "public"."set_row_updated_at"();



ALTER TABLE ONLY "public"."audit_events"
    ADD CONSTRAINT "audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."custom_requests"
    ADD CONSTRAINT "custom_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."generation_requests"
    ADD CONSTRAINT "generation_requests_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."itineraries"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."generation_requests"
    ADD CONSTRAINT "generation_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."itineraries"
    ADD CONSTRAINT "itineraries_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."itineraries"
    ADD CONSTRAINT "itineraries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."itinerary_versions"
    ADD CONSTRAINT "itinerary_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."itinerary_versions"
    ADD CONSTRAINT "itinerary_versions_itinerary_id_fkey" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."itinerary_versions"
    ADD CONSTRAINT "itinerary_versions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_imports"
    ADD CONSTRAINT "trip_imports_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."itineraries"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trip_imports"
    ADD CONSTRAINT "trip_imports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_invitations"
    ADD CONSTRAINT "trip_invitations_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trip_invitations"
    ADD CONSTRAINT "trip_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."trip_invitations"
    ADD CONSTRAINT "trip_invitations_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."itineraries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_ledgers"
    ADD CONSTRAINT "trip_ledgers_itinerary_id_fkey" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_members"
    ADD CONSTRAINT "trip_members_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trip_members"
    ADD CONSTRAINT "trip_members_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."itineraries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_members"
    ADD CONSTRAINT "trip_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_share_links"
    ADD CONSTRAINT "trip_share_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."trip_share_links"
    ADD CONSTRAINT "trip_share_links_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."itineraries"("id") ON DELETE CASCADE;



ALTER TABLE "public"."audit_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_events_delete_never" ON "public"."audit_events" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "audit_events_insert_service_only" ON "public"."audit_events" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "audit_events_select_owner" ON "public"."audit_events" FOR SELECT TO "authenticated" USING ("public"."current_user_owns_trip"("trip_id"));



CREATE POLICY "audit_events_update_never" ON "public"."audit_events" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



ALTER TABLE "public"."custom_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "custom_requests_delete_own" ON "public"."custom_requests" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "custom_requests_insert_server_only" ON "public"."custom_requests" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "custom_requests_select_own" ON "public"."custom_requests" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "custom_requests_update_server_only" ON "public"."custom_requests" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



ALTER TABLE "public"."generation_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "generation_requests_select_own" ON "public"."generation_requests" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."itineraries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "itineraries_delete_owner" ON "public"."itineraries" FOR DELETE TO "authenticated" USING ("public"."current_user_owns_trip"("id"));



CREATE POLICY "itineraries_insert_owner" ON "public"."itineraries" FOR INSERT TO "authenticated" WITH CHECK ((("owner_id" = "auth"."uid"()) AND ("status" = 'draft'::"text") AND ("visibility" = 'private'::"text") AND ("deleted_at" IS NULL)));



CREATE POLICY "itineraries_select_member" ON "public"."itineraries" FOR SELECT TO "authenticated" USING ((("owner_id" = "auth"."uid"()) OR (("deleted_at" IS NULL) AND "public"."current_user_has_trip_role"("id", ARRAY['owner'::"text", 'editor'::"text", 'viewer'::"text"]))));



CREATE POLICY "itineraries_update_owner_editor" ON "public"."itineraries" FOR UPDATE TO "authenticated" USING ((("deleted_at" IS NULL) AND "public"."current_user_has_trip_role"("id", ARRAY['owner'::"text", 'editor'::"text"]))) WITH CHECK (("public"."current_user_has_trip_role"("id", ARRAY['owner'::"text", 'editor'::"text"]) AND (("deleted_at" IS NULL) OR "public"."current_user_owns_trip"("id"))));



ALTER TABLE "public"."itinerary_shares" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "itinerary_shares_delete_never" ON "public"."itinerary_shares" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "itinerary_shares_insert_never" ON "public"."itinerary_shares" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "itinerary_shares_select_never" ON "public"."itinerary_shares" FOR SELECT TO "authenticated" USING (false);



CREATE POLICY "itinerary_shares_update_never" ON "public"."itinerary_shares" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



ALTER TABLE "public"."itinerary_versions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "newsletter_delete_server_only" ON "public"."newsletter_subscribers" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "newsletter_insert_server_only" ON "public"."newsletter_subscribers" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "newsletter_select_never" ON "public"."newsletter_subscribers" FOR SELECT TO "authenticated" USING (false);



ALTER TABLE "public"."newsletter_subscribers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "newsletter_update_server_only" ON "public"."newsletter_subscribers" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_delete_never" ON "public"."profiles" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



ALTER TABLE "public"."trip_imports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_imports_delete_service_only" ON "public"."trip_imports" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "trip_imports_insert_own" ON "public"."trip_imports" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND ((("status" = 'pending'::"text") AND ("trip_id" IS NULL) AND ("completed_at" IS NULL)) OR (("status" = 'completed'::"text") AND ("trip_id" IS NOT NULL) AND "public"."current_user_owns_trip"("trip_id")))));



CREATE POLICY "trip_imports_select_own" ON "public"."trip_imports" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "trip_imports_update_service_only" ON "public"."trip_imports" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



ALTER TABLE "public"."trip_invitations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_invitations_delete_owner" ON "public"."trip_invitations" FOR DELETE TO "authenticated" USING ("public"."current_user_owns_trip"("trip_id"));



CREATE POLICY "trip_invitations_insert_owner" ON "public"."trip_invitations" FOR INSERT TO "authenticated" WITH CHECK (("public"."current_user_owns_trip"("trip_id") AND ("invited_by" = "auth"."uid"()) AND ("role" = ANY (ARRAY['editor'::"text", 'viewer'::"text"])) AND ("accepted_at" IS NULL) AND ("accepted_by" IS NULL) AND ("revoked_at" IS NULL)));



CREATE POLICY "trip_invitations_revoke_owner" ON "public"."trip_invitations" FOR UPDATE TO "authenticated" USING (("public"."current_user_owns_trip"("trip_id") AND ("accepted_at" IS NULL) AND ("revoked_at" IS NULL))) WITH CHECK (("public"."current_user_owns_trip"("trip_id") AND ("accepted_at" IS NULL) AND ("accepted_by" IS NULL) AND ("revoked_at" IS NOT NULL)));



CREATE POLICY "trip_invitations_select_owner" ON "public"."trip_invitations" FOR SELECT TO "authenticated" USING ("public"."current_user_owns_trip"("trip_id"));



ALTER TABLE "public"."trip_ledgers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_ledgers_delete_owner" ON "public"."trip_ledgers" FOR DELETE TO "authenticated" USING ((("itinerary_id" IS NOT NULL) AND "public"."current_user_owns_trip"("itinerary_id")));



CREATE POLICY "trip_ledgers_insert_owner_editor" ON "public"."trip_ledgers" FOR INSERT TO "authenticated" WITH CHECK ((("itinerary_id" IS NOT NULL) AND "public"."current_user_has_trip_role"("itinerary_id", ARRAY['owner'::"text", 'editor'::"text"])));



CREATE POLICY "trip_ledgers_select_member" ON "public"."trip_ledgers" FOR SELECT TO "authenticated" USING ((("itinerary_id" IS NOT NULL) AND "public"."current_user_has_trip_role"("itinerary_id")));



CREATE POLICY "trip_ledgers_update_owner_editor" ON "public"."trip_ledgers" FOR UPDATE TO "authenticated" USING ((("itinerary_id" IS NOT NULL) AND "public"."current_user_has_trip_role"("itinerary_id", ARRAY['owner'::"text", 'editor'::"text"]))) WITH CHECK ((("itinerary_id" IS NOT NULL) AND "public"."current_user_has_trip_role"("itinerary_id", ARRAY['owner'::"text", 'editor'::"text"])));



ALTER TABLE "public"."trip_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_members_delete_owner_or_self" ON "public"."trip_members" FOR DELETE TO "authenticated" USING ((("role" <> 'owner'::"text") AND ("public"."current_user_owns_trip"("trip_id") OR ("user_id" = "auth"."uid"()))));



CREATE POLICY "trip_members_insert_service_only" ON "public"."trip_members" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "trip_members_select_member" ON "public"."trip_members" FOR SELECT TO "authenticated" USING (("public"."current_user_owns_trip"("trip_id") OR (("revoked_at" IS NULL) AND "public"."current_user_has_trip_role"("trip_id"))));



CREATE POLICY "trip_members_update_owner" ON "public"."trip_members" FOR UPDATE TO "authenticated" USING (("public"."current_user_owns_trip"("trip_id") AND ("role" <> 'owner'::"text"))) WITH CHECK (("public"."current_user_owns_trip"("trip_id") AND ("role" = ANY (ARRAY['editor'::"text", 'viewer'::"text"]))));



ALTER TABLE "public"."trip_share_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_share_links_delete_owner" ON "public"."trip_share_links" FOR DELETE TO "authenticated" USING ("public"."current_user_owns_trip"("trip_id"));



CREATE POLICY "trip_share_links_insert_owner" ON "public"."trip_share_links" FOR INSERT TO "authenticated" WITH CHECK (("public"."current_user_owns_trip"("trip_id") AND ("created_by" = "auth"."uid"())));



CREATE POLICY "trip_share_links_revoke_owner" ON "public"."trip_share_links" FOR UPDATE TO "authenticated" USING (("public"."current_user_owns_trip"("trip_id") AND ("revoked_at" IS NULL))) WITH CHECK (("public"."current_user_owns_trip"("trip_id") AND ("revoked_at" IS NOT NULL)));



CREATE POLICY "trip_share_links_select_owner" ON "public"."trip_share_links" FOR SELECT TO "authenticated" USING ("public"."current_user_owns_trip"("trip_id"));



CREATE POLICY "versions_delete_owner" ON "public"."itinerary_versions" FOR DELETE TO "authenticated" USING ("public"."current_user_owns_trip"("itinerary_id"));



CREATE POLICY "versions_insert_owner_editor" ON "public"."itinerary_versions" FOR INSERT TO "authenticated" WITH CHECK (("public"."current_user_has_trip_role"("itinerary_id", ARRAY['owner'::"text", 'editor'::"text"]) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "versions_select_member" ON "public"."itinerary_versions" FOR SELECT TO "authenticated" USING ("public"."current_user_has_trip_role"("itinerary_id"));



CREATE POLICY "versions_update_never" ON "public"."itinerary_versions" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "private"."current_audit_actor"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."accept_trip_invitation_transaction"("p_token_hash" "text", "p_user_id" "uuid", "p_email_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."accept_trip_invitation_transaction"("p_token_hash" "text", "p_user_id" "uuid", "p_email_hash" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."checkpoint_generation_request"("p_request_id" "uuid", "p_lease_token" "uuid", "p_checkpoint" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."checkpoint_generation_request"("p_request_id" "uuid", "p_lease_token" "uuid", "p_checkpoint" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."complete_generation_request"("p_request_id" "uuid", "p_lease_token" "uuid", "p_trip_record" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."complete_generation_request"("p_request_id" "uuid", "p_lease_token" "uuid", "p_trip_record" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."current_user_has_trip_role"("p_trip_id" "uuid", "p_roles" "text"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_user_has_trip_role"("p_trip_id" "uuid", "p_roles" "text"[]) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."current_user_owns_trip"("p_trip_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_user_owns_trip"("p_trip_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."enforce_trip_invitation_client_update"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."enforce_trip_share_client_update"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."fail_generation_request"("p_request_id" "uuid", "p_lease_token" "uuid", "p_failure_code" "text", "p_retryable" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fail_generation_request"("p_request_id" "uuid", "p_lease_token" "uuid", "p_failure_code" "text", "p_retryable" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."handle_new_auth_user"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."normalize_audit_event"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."record_trip_audit_event"("p_trip_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_metadata" "jsonb") FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."reserve_generation_request"("p_idempotency_key" "text", "p_request_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reserve_generation_request"("p_idempotency_key" "text", "p_request_hash" "text") TO "authenticated";



GRANT ALL ON TABLE "public"."audit_events" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_events" TO "service_role";



GRANT ALL ON TABLE "public"."custom_requests" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."custom_requests" TO "authenticated";



GRANT ALL ON TABLE "public"."generation_requests" TO "service_role";
GRANT SELECT ON TABLE "public"."generation_requests" TO "authenticated";



GRANT ALL ON TABLE "public"."itineraries" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."itineraries" TO "authenticated";



GRANT ALL ON TABLE "public"."itinerary_shares" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."itinerary_shares" TO "authenticated";



GRANT ALL ON TABLE "public"."itinerary_versions" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."itinerary_versions" TO "authenticated";



GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."newsletter_subscribers" TO "authenticated";



GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."profiles" TO "authenticated";



GRANT ALL ON TABLE "public"."trip_imports" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_imports" TO "service_role";



GRANT ALL ON TABLE "public"."trip_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."trip_ledgers" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."trip_ledgers" TO "authenticated";



GRANT ALL ON TABLE "public"."trip_members" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_members" TO "service_role";



GRANT ALL ON TABLE "public"."trip_share_links" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_share_links" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "service_role";
