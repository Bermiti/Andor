-- Local/staging-only deterministic fixture. This account has no usable login
-- credential; it exists to exercise the auth.users -> profiles trigger after a
-- clean reset. Never apply seeds to production.
insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000000100',
  'authenticated',
  'authenticated',
  'seed-profile@andor.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Andor staging fixture"}'::jsonb,
  now(),
  now()
)
on conflict (id) do nothing;
