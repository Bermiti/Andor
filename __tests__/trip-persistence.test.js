import { describe, expect, test, vi, beforeEach } from 'vitest';
import {
  migrateTripData,
  updateSavedTrip,
  getTripOperationalSummary,
  duplicateSavedTrip,
  renameSavedTrip
} from '../app/lib/itinerary-store';

describe('trip persistence layer', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  test('migrates old v1 data to v3 with default operational status', () => {
    const oldTrip = { id: 'trip-1', destination: 'Paris', days: [{}] };
    const migrated = migrateTripData(oldTrip);
    
    expect(migrated.dataVersion).toBe(4);
    expect(migrated.lifecycle.status).toBe('generated');
  });

  test('updateSavedTrip updates data and re-calculates operational status', () => {
    const trip = migrateTripData({ id: 'trip-2', destination: 'London', days: [{}] });
    localStorage.setItem('andor_itinerary_trip-2', JSON.stringify(trip));

    // Force items to be ready
    updateSavedTrip('trip-2', (t) => {
      if (!t.bookingChecklist) t.bookingChecklist = { items: [] };
      if (!t.documentsChecklist) t.documentsChecklist = { items: [] };
      t.bookingChecklist.items = [{ status: 'confirmed' }];
      t.documentsChecklist.items = [{ status: 'ready', audience: 'client', importance: 'required' }];
      t.lifecycle.status = null; // force derivation
      return t;
    });

    const updatedStr = localStorage.getItem('andor_itinerary_trip-2');
    const updated = JSON.parse(updatedStr);

    expect(updated.bookingChecklist.items[0].status).toBe('confirmed');
    // Operational status should be ready_to_travel because all items are confirmed/ready
    expect(updated.lifecycle.status).toBe('ready_to_travel');
  });

  test('persists manual activity edits when a trip only exists in session storage', () => {
    const trip = migrateTripData({
      id: 'trip-session',
      destination: 'Lisbon',
      days: [{ stops: [{ id: 'stop-1', name: 'Alfama walk' }] }],
    });
    sessionStorage.setItem('andor_itinerary_trip-session', JSON.stringify(trip));

    updateSavedTrip('trip-session', (current) => ({
      ...current,
      days: [{
        ...current.days[0],
        stops: [{ ...current.days[0].stops[0], planningStatus: 'confirmed', userNotes: 'Meet at 09:00' }],
      }],
    }));

    const persisted = JSON.parse(localStorage.getItem('andor_itinerary_trip-session'));
    expect(persisted.days[0].stops[0]).toMatchObject({
      planningStatus: 'confirmed',
      userNotes: 'Meet at 09:00',
    });
  });

  test('getTripOperationalSummary counts missing items', () => {
    const trip = migrateTripData({ id: 'trip-3', destination: 'Tokyo', days: [{}] });
    trip.lifecycle.status = null; // force derivation
    trip.bookingChecklist = {
      items: [
        { status: 'not_started', priority: 'high' },
        { status: 'booked', priority: 'medium' }
      ]
    };
    trip.documentsChecklist = {
      items: [
        { status: 'needed', audience: 'client', importance: 'required' }
      ]
    };

    const summary = getTripOperationalSummary(trip);
    expect(summary.bookings.total).toBe(2);
    expect(summary.bookings.ready).toBe(1);
    expect(summary.bookings.missing).toBe(1);
    expect(summary.documents.missing).toBe(1);
    expect(summary.status).toBe('booking_in_progress');
  });

  test('duplicateSavedTrip preserves the status of the original trip', () => {
    const trip = migrateTripData({ id: 'trip-4', destination: 'Rome' });
    trip.lifecycle.status = 'ready_to_send';
    localStorage.setItem('andor_itinerary_trip-4', JSON.stringify(trip));
    
    // mock trips list
    localStorage.setItem('andor_saved_trips', JSON.stringify([{ id: 'trip-4', name: 'Rome', updatedAt: Date.now() }]));

    const newTripId = duplicateSavedTrip('trip-4');
    expect(newTripId).not.toBe('trip-4');
    
    const newTripStr = localStorage.getItem(`andor_itinerary_${newTripId}`);
    const newTrip = JSON.parse(newTripStr);
    
    expect(newTrip.lifecycle.status).toBe('ready_to_send');
  });
});
