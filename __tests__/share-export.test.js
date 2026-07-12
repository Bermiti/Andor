import { describe, expect, test } from 'vitest';
import {
  buildSharePayload,
  buildClientShareSummary,
  buildInternalShareSummary,
  hasInternalNotesLeakRisk,
  encodeSharePayload,
  decodeSharePayload,
} from '../app/lib/share-utils';

describe('share and export capabilities', () => {
  const mockItinerary = {
    id: 'test-trip-1',
    destination: 'Madrid',
    trip: {
      totalDays: 3,
      travelerProfile: {
        internalNotes: 'Client is VIP, needs 5 star hotel.'
      }
    },
    exportMetadata: {
      clientFacingNotes: 'Enjoy your trip!',
      internalNotes: 'Booked via special supplier.'
    },
    bookingChecklist: {
      items: [
        { id: '1', status: 'booked', price: 'EUR 500', internalNotes: 'Got a discount.' },
        { id: '2', status: 'selected', audience: 'internal', task: 'Protect agency margin' }
      ]
    },
    days: [{ dayNumber: 1, title: 'Arrival', internalNotes: 'Use the preferred supplier.' }],
    documentsChecklist: {
      items: [
        { id: 'client_itinerary_approval', audience: 'client', status: 'ready' },
        { id: 'agency_contract', audience: 'internal', status: 'needed' }
      ]
    }
  };

  test('round-trips UTF-8 share payloads', () => {
    const payload = { destination: 'Tóquio', note: 'Café, elétrico e €120' };
    expect(decodeSharePayload(encodeSharePayload(payload))).toEqual(payload);
  });

  test('buildSharePayload strips internal properties for client audience', () => {
    const payload = buildSharePayload(mockItinerary, 'client');
    
    // Original metadata has internalNotes, but exportMetadata for client should not
    expect(payload.exportMetadata.internalNotes).toBeUndefined();
    expect(payload.exportMetadata.clientFacingNotes).toBe('Enjoy your trip!');
    expect(payload.trip.travelerProfile.internalNotes).toBeUndefined();
    expect(payload.days[0].internalNotes).toBeUndefined();
    expect(payload.bookingChecklist[0].internalNotes).toBeUndefined();
    expect(payload.bookingChecklist.some((item) => item.audience === 'internal')).toBe(false);
    
    // Internal document should not be present in client payload
    const hasInternalDoc = payload.documentsChecklist.some(doc => doc.audience === 'internal');
    expect(hasInternalDoc).toBe(false);
  });

  test('buildSharePayload includes internal properties for internal audience', () => {
    const payload = buildSharePayload(mockItinerary, 'internal');
    
    expect(payload.exportMetadata.internalNotes).toBe('Booked via special supplier.');
    expect(payload.trip.travelerProfile.internalNotes).toContain('VIP');
    expect(payload.days[0].internalNotes).toContain('preferred supplier');
    const hasInternalDoc = payload.documentsChecklist.some(doc => doc.audience === 'internal');
    expect(hasInternalDoc).toBe(true);
  });

  test('buildClientShareSummary creates a clean text representation', () => {
    const summary = buildClientShareSummary(mockItinerary);
    
    expect(summary).toContain('Madrid');
    expect(summary).toContain('3 dias');
    expect(summary).toContain('Enjoy your trip!');
    expect(summary).not.toContain('VIP');
    expect(summary).not.toContain('special supplier');
  });

  test('internal summary includes operations notes without changing the client summary', () => {
    const internal = buildInternalShareSummary(mockItinerary);
    const client = buildClientShareSummary(mockItinerary);

    expect(internal).toContain('[INTERNO]');
    expect(internal).toContain('Booked via special supplier.');
    expect(client).not.toContain('special supplier');
    expect(client).not.toContain('VIP');
  });

  test('hasInternalNotesLeakRisk trusts the sanitized client payload', () => {
    const risk = hasInternalNotesLeakRisk(mockItinerary, 'client');
    expect(risk).toBe(false);

    const safeRisk = hasInternalNotesLeakRisk(mockItinerary, 'internal');
    expect(safeRisk).toBe(false);
  });
});
