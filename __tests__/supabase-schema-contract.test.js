// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
const baselineMigration = readFileSync(
  new URL('../supabase/migrations/202608010000_base_schema.sql', import.meta.url),
  'utf8'
);
const profileMigration = readFileSync(
  new URL('../supabase/migrations/202608050001_auth_profile_trigger.sql', import.meta.url),
  'utf8'
);
const securityMigration = readFileSync(
  new URL('../supabase/migrations/202608050002_security_reconciliation.sql', import.meta.url),
  'utf8'
);
const normalized = schema.replaceAll('"', '').replace(/\s+/g, ' ').toLowerCase();

describe('Supabase schema snapshot contract', () => {
  it('accepts the lifecycle and import states written by the repositories', () => {
    expect(normalized).toMatch(/itineraries_status_check.*draft.*active.*archived.*deleted.*legacy_pending/);
    expect(normalized).toMatch(/trip_imports_status_check.*pending.*completed.*conflict.*failed/);
  });

  it('uses the audit fields expected by the backend', () => {
    expect(normalized).toContain('actor_user_id uuid');
    expect(normalized).toContain('resource_type text not null');
    expect(normalized).toContain('resource_id uuid not null');
    expect(normalized).not.toMatch(/\btarget_type\b/);
    expect(normalized).not.toMatch(/\btarget_id\b/);
  });

  it('exposes only the hashed, service-role invitation transaction', () => {
    expect(normalized).not.toMatch(/function public\.accept_trip_invitation\(/);
    expect(normalized).toContain('function public.accept_trip_invitation_transaction');
    expect(normalized).toMatch(/grant all on function public\.accept_trip_invitation_transaction.*to service_role/);
    expect(securityMigration).toContain('drop function if exists public.accept_trip_invitation(text)');
    expect(securityMigration).toContain('from public, anon, authenticated');
  });

  it('creates profiles independently of an immediate signup session', () => {
    expect(profileMigration).toContain('function public.handle_new_auth_user()');
    expect(profileMigration).toContain('after insert on auth.users');
    expect(profileMigration).toContain('for each row execute function public.handle_new_auth_user()');
    expect(securityMigration).toContain('from auth.users auth_user');
  });

  it('has a default-deny baseline before canonical migrations run', () => {
    expect(baselineMigration).toContain('create table if not exists public.profiles');
    expect(baselineMigration).toContain('create table if not exists public.itineraries');
    expect(baselineMigration).toContain('from anon, authenticated');
    expect(baselineMigration).not.toContain('with check (true)');
  });
});
