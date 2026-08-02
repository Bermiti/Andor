export const TRIP_ROLES = Object.freeze(['owner', 'editor', 'viewer']);

const ROLE_RANK = Object.freeze({
  viewer: 1,
  editor: 2,
  owner: 3,
});

const ACTION_ROLES = Object.freeze({
  read: new Set(TRIP_ROLES),
  edit: new Set(['owner', 'editor']),
  delete: new Set(['owner']),
  manage_members: new Set(['owner']),
  manage_shares: new Set(['owner']),
});

export function normalizeTripRole(value) {
  const role = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return TRIP_ROLES.includes(role) ? role : null;
}

export function roleMeetsMinimum(role, minimumRole = 'viewer') {
  const normalizedRole = normalizeTripRole(role);
  const normalizedMinimum = normalizeTripRole(minimumRole);
  if (!normalizedRole || !normalizedMinimum) return false;
  return ROLE_RANK[normalizedRole] >= ROLE_RANK[normalizedMinimum];
}

export function canPerformTripAction(role, action) {
  const normalizedRole = normalizeTripRole(role);
  return Boolean(normalizedRole && ACTION_ROLES[action]?.has(normalizedRole));
}

export function canAssignTripRole(actorRole, requestedRole) {
  return normalizeTripRole(actorRole) === 'owner' && Boolean(normalizeTripRole(requestedRole));
}

