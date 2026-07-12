import 'server-only';

import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

const PASSWORD_KEY_LENGTH = 64;

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function hashOpaqueToken(value) {
  return createHash('sha256').update(String(value || '')).digest('hex');
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(password), salt, PASSWORD_KEY_LENGTH).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, expectedHash) {
  try {
    const actual = scryptSync(String(password), salt, PASSWORD_KEY_LENGTH);
    const expected = Buffer.from(expectedHash, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch (error) {
    return false;
  }
}

export function createIdentifier() {
  return randomUUID();
}
