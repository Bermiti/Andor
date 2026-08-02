import { describe, expect, test } from 'vitest';
import {
  canAssignTripRole,
  canPerformTripAction,
  normalizeTripRole,
  roleMeetsMinimum,
} from '../app/lib/trip-permissions';

describe('trip permission matrix', () => {
  test.each([
    ['owner', true, true, true, true, true],
    ['editor', true, true, false, false, false],
    ['viewer', true, false, false, false, false],
    [null, false, false, false, false, false],
  ])('%s permissions are explicit', (role, read, edit, remove, members, shares) => {
    expect(canPerformTripAction(role, 'read')).toBe(read);
    expect(canPerformTripAction(role, 'edit')).toBe(edit);
    expect(canPerformTripAction(role, 'delete')).toBe(remove);
    expect(canPerformTripAction(role, 'manage_members')).toBe(members);
    expect(canPerformTripAction(role, 'manage_shares')).toBe(shares);
  });

  test('unknown roles and actions fail closed', () => {
    expect(normalizeTripRole('admin')).toBeNull();
    expect(canPerformTripAction('owner', 'transfer_owner')).toBe(false);
    expect(roleMeetsMinimum('editor', 'owner')).toBe(false);
  });

  test('only an owner can assign a valid trip role', () => {
    expect(canAssignTripRole('owner', 'viewer')).toBe(true);
    expect(canAssignTripRole('editor', 'viewer')).toBe(false);
    expect(canAssignTripRole('owner', 'admin')).toBe(false);
  });
});
