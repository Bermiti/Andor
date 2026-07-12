import 'server-only';

import { SESSION_MAX_AGE_SECONDS } from '../auth-constants';
import {
  createLocalSession,
  createLocalUser,
  deleteLocalSession,
  getLocalSession,
  getLocalUserByEmail,
} from './local-db';
import {
  createOpaqueToken,
  hashOpaqueToken,
  hashPassword,
  verifyPassword,
} from './security';

function userDto(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt || user.created_at,
    visitedCountries: [],
    trips: [],
    interests: ['History', 'Food'],
    bio: '',
    lookingForBuddy: false,
  };
}

function createSessionForUser(userId) {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
  createLocalSession({ tokenHash: hashOpaqueToken(token), userId, expiresAt });
  return { token, expiresAt };
}

export function registerLocalUser({ name, email, password }) {
  if (getLocalUserByEmail(email)) {
    return { ok: false, code: 'EMAIL_EXISTS', message: 'Este email já está registado.' };
  }

  const passwordData = hashPassword(password);
  const user = createLocalUser({
    name,
    email,
    passwordHash: passwordData.hash,
    passwordSalt: passwordData.salt,
  });
  return { ok: true, user: userDto(user), session: createSessionForUser(user.id) };
}

export function loginLocalUser({ email, password }) {
  const row = getLocalUserByEmail(email);
  if (!row || !verifyPassword(password, row.password_salt, row.password_hash)) {
    return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Email ou palavra-passe inválidos.' };
  }

  return {
    ok: true,
    user: userDto(row),
    session: createSessionForUser(row.id),
  };
}

export function readLocalUserFromToken(token) {
  if (!token) return null;
  const session = getLocalSession(hashOpaqueToken(token));
  return session ? userDto(session.user) : null;
}

export function logoutLocalUser(token) {
  if (token) deleteLocalSession(hashOpaqueToken(token));
}
