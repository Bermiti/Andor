-- Ensure every Supabase identity receives an application profile, including
-- password sign-ups that are awaiting email confirmation.
begin;

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

commit;
