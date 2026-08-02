import {
  bindBrowserDataToUser,
  CACHE_SUBJECT_KEY,
  clearBrowserDataSubject,
} from '../app/lib/browser-data-boundary';

describe('browser data account boundary', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('preserves legacy data for the first authenticated import opportunity', () => {
    localStorage.setItem('andor_saved_trips', '[{"id":"legacy"}]');
    expect(bindBrowserDataToUser('user-a')).toEqual({ switched: false });
    expect(localStorage.getItem('andor_saved_trips')).not.toBeNull();
    expect(localStorage.getItem(CACHE_SUBJECT_KEY)).toBe('user-a');
  });

  it('purges sensitive local and session caches when the account changes', () => {
    bindBrowserDataToUser('user-a');
    localStorage.setItem('andor_itinerary_private', '{"clientName":"Private"}');
    localStorage.setItem('andor_visited_countries', '["620"]');
    sessionStorage.setItem('andor_shared_private', '{"internalNotes":"Private"}');
    localStorage.setItem('andor_language', 'pt');

    expect(bindBrowserDataToUser('user-b')).toEqual({ switched: true });
    expect(localStorage.getItem('andor_itinerary_private')).toBeNull();
    expect(localStorage.getItem('andor_visited_countries')).toBeNull();
    expect(sessionStorage.getItem('andor_shared_private')).toBeNull();
    expect(localStorage.getItem('andor_language')).toBe('pt');
    expect(localStorage.getItem(CACHE_SUBJECT_KEY)).toBe('user-b');
  });

  it('purges sensitive data on logout', () => {
    bindBrowserDataToUser('user-a');
    localStorage.setItem('andor_saved_trips', '[]');
    sessionStorage.setItem('andor_packing_trip', '{}');
    clearBrowserDataSubject();
    expect(localStorage.getItem('andor_saved_trips')).toBeNull();
    expect(sessionStorage.getItem('andor_packing_trip')).toBeNull();
    expect(localStorage.getItem(CACHE_SUBJECT_KEY)).toBeNull();
  });
});
