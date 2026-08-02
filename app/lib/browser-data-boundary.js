const CACHE_SUBJECT_KEY = 'andor_cache_subject';

const SENSITIVE_EXACT_KEYS = new Set([
  'andor_saved_trips',
  'andor_user',
  'andor_visited_countries',
]);

const SENSITIVE_PREFIXES = [
  'andor_itinerary_',
  'andor_shared_',
  'andor_booking_',
  'andor_documents_',
  'andor_rental_',
  'andor_packing_',
  'andor_trip_ledger',
  'andor_expense_',
];

function isSensitiveKey(key) {
  return SENSITIVE_EXACT_KEYS.has(key)
    || SENSITIVE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function removeSensitiveKeys(storage) {
  if (!storage) return;
  const keys = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && isSensitiveKey(key)) keys.push(key);
  }
  keys.forEach((key) => storage.removeItem(key));
}

export function purgeSensitiveBrowserData() {
  if (typeof window === 'undefined') return;
  removeSensitiveKeys(window.localStorage);
  removeSensitiveKeys(window.sessionStorage);
}

export function bindBrowserDataToUser(userId) {
  if (typeof window === 'undefined' || !userId) return { switched: false };
  const previous = window.localStorage.getItem(CACHE_SUBJECT_KEY);
  const switched = Boolean(previous && previous !== userId);
  if (switched) purgeSensitiveBrowserData();
  window.localStorage.setItem(CACHE_SUBJECT_KEY, String(userId));
  return { switched };
}

export function clearBrowserDataSubject() {
  if (typeof window === 'undefined') return;
  purgeSensitiveBrowserData();
  window.localStorage.removeItem(CACHE_SUBJECT_KEY);
  window.sessionStorage.removeItem(CACHE_SUBJECT_KEY);
}

export function hasBrowserDataSubject() {
  return typeof window !== 'undefined'
    && Boolean(window.localStorage.getItem(CACHE_SUBJECT_KEY));
}

export { CACHE_SUBJECT_KEY };
