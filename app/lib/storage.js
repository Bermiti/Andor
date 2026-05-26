import { safeParse, safeStringify } from './safe-json';

function getStorage(kind = 'local') {
  if (typeof window === 'undefined') return null;
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage;
  } catch (error) {
    return null;
  }
}

export function getJson(key, fallback = null, kind = 'local') {
  const storage = getStorage(kind);
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return safeParse(raw, fallback);
  } catch (error) {
    return fallback;
  }
}

export function setJson(key, value, kind = 'local') {
  const storage = getStorage(kind);
  if (!storage) return false;
  try {
    const serialized = safeStringify(value, null);
    if (!serialized) return false;
    storage.setItem(key, serialized);
    return true;
  } catch (error) {
    return false;
  }
}

export function getString(key, fallback = '', kind = 'local') {
  const storage = getStorage(kind);
  if (!storage) return fallback;
  try {
    return storage.getItem(key) ?? fallback;
  } catch (error) {
    return fallback;
  }
}

export function setString(key, value, kind = 'local') {
  const storage = getStorage(kind);
  if (!storage) return false;
  try {
    storage.setItem(key, String(value));
    return true;
  } catch (error) {
    return false;
  }
}

export function removeItem(key, kind = 'local') {
  const storage = getStorage(kind);
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}
