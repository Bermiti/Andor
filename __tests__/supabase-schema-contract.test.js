// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');

describe('Supabase schema snapshot contract', () => {
  it('accepts the lifecycle and import states written by the repositories', () => {
    expect(schema).toContain("status in ('draft', 'active', 'archived', 'deleted', 'legacy_pending')");
    expect(schema).toContain("status in ('pending', 'completed', 'conflict', 'failed')");
  });

  it('uses the audit fields expected by the backend', () => {
    expect(schema).toContain('actor_user_id uuid');
    expect(schema).toContain('resource_type text not null');
    expect(schema).toContain('resource_id uuid not null');
    expect(schema).not.toMatch(/\btarget_type\b/);
    expect(schema).not.toMatch(/\btarget_id\b/);
  });

  it('does not expose invitation acceptance to authenticated SQL clients', () => {
    expect(schema).not.toContain('create or replace function public.accept_trip_invitation');
    expect(schema).not.toContain('grant execute on function public.accept_trip_invitation');
    expect(schema).toContain('drop function if exists public.accept_trip_invitation(text)');
  });

  it('creates profiles independently of an immediate signup session', () => {
    expect(schema).toContain('function public.handle_new_auth_user()');
    expect(schema).toContain('after insert on auth.users');
    expect(schema).toContain('for each row execute function public.handle_new_auth_user()');
  });
});
