import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  sanitizeAnalyticsPath,
  sanitizeAnalyticsProperties,
  trackEvent,
} from '../app/lib/analytics';

describe('privacy-safe analytics buffer', () => {
  beforeEach(() => {
    window.andor_events = [];
    window.history.replaceState({}, '', '/api/auth/callback?code=oauth-secret&email=user@example.com');
  });

  test('removes sensitive and structured values before buffering an event', () => {
    expect(sanitizeAnalyticsProperties({
      email: 'traveler@example.com',
      auth_token: 'secret',
      free_text_notes: 'private plans',
      destination: 'Private destination',
      trip_id: 'private-trip-id',
      destination_kind: 'city',
      trip_length_days: 4,
      success: true,
      nested: { private: true },
    })).toEqual({
      destination_kind: 'city',
      trip_length_days: 4,
      success: true,
    });
  });

  test('records only the path and never copies query parameters or a full URL', () => {
    const listener = vi.fn();
    window.addEventListener('andor-telemetry', listener, { once: true });

    expect(trackEvent('registration_completed', {
      email: 'traveler@example.com',
      source: 'login_modal',
    })).toBe(true);

    const event = window.andor_events[0];
    expect(event.event).toBe('registration_completed');
    expect(event.properties.source).toBe('login_modal');
    expect(event.properties.path).toBe('/api/auth/callback');
    expect(JSON.stringify(event)).not.toContain('oauth-secret');
    expect(JSON.stringify(event)).not.toContain('traveler@example.com');
    expect(listener).toHaveBeenCalledOnce();
  });

  test('rejects invalid names and bounds the in-memory queue', () => {
    expect(trackEvent('Invalid Event', {})).toBe(false);
    for (let index = 0; index < 205; index += 1) {
      trackEvent('homepage_viewed', { sequence: index });
    }
    expect(window.andor_events).toHaveLength(200);
    expect(window.andor_events[0].properties.sequence).toBe(5);
  });

  test('redacts invitation, share and private trip identifiers from paths', () => {
    expect(sanitizeAnalyticsPath('/invitations/opaque-invite-token')).toBe('/invitations/:token');
    expect(sanitizeAnalyticsPath('/itinerary/share/private-share-token')).toBe('/itinerary/share/:token');
    expect(sanitizeAnalyticsPath('/itinerary/6db67a69-18e7-4b50-bf47-41488121851b')).toBe('/itinerary/:id');
    expect(sanitizeAnalyticsPath('/itinerary/tokyo-food')).toBe('/itinerary/tokyo-food');
  });
});
