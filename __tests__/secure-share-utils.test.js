import { describe, expect, it } from 'vitest';
import { buildPublicShareSnapshot } from '../app/lib/share-utils';

describe('public share snapshot allowlist', () => {
  it('keeps reviewed client fields and drops private or newly-added fields at every level', () => {
    const snapshot = buildPublicShareSnapshot({
      id: 'private-trip-id',
      destination: {
        city: 'Edinburgh',
        country: 'Scotland, United Kingdom',
        countryCode: 'GB',
        hotelAddress: 'Private lodging address',
        currency: { code: 'GBP', symbol: 'Â£', bankAccount: 'SECRET-IBAN' },
      },
      trip: {
        totalDays: 3,
        summary: 'A client-safe overview.',
        travelStyle: 'culture',
        clientName: 'SECRET-CLIENT',
        internalNotes: 'SECRET-TRIP-NOTE',
        travelerProfile: { passport: 'SECRET-PASSPORT', allergies: 'SECRET-HEALTH' },
        budgetBreakdown: { commission: 900 },
      },
      days: [{
        id: 'day-1',
        dayNumber: 1,
        title: 'Old Town',
        internalNotes: 'SECRET-DAY-NOTE',
        stops: [{
          id: 'stop-1',
          time: '10:00',
          name: 'Castle',
          description: 'Client-safe description.',
          duration: '2 hours',
          supplierNotes: 'SECRET-SUPPLIER',
          bookingReference: 'SECRET-BOOKING-REF',
          source: { url: 'https://supplier.example/private' },
          photo: { url: 'https://tracker.example/pixel' },
          arbitraryFutureField: 'SECRET-FUTURE',
        }],
      }],
      exportMetadata: {
        clientFacingNotes: 'Bring a raincoat.',
        companyName: 'Andor Travels',
        clientName: 'SECRET-CLIENT',
        internalNotes: 'SECRET-AGENCY-NOTE',
      },
      bookingChecklist: {
        items: [
          { id: 'book-1', task: 'Museum ticket', status: 'selected', bookingReference: 'SECRET-REF' },
          { id: 'book-2', task: 'Agency task', status: 'booked', audience: 'internal' },
        ],
      },
      documentsChecklist: {
        items: [
          { id: 'doc-1', title: 'Travel document', status: 'needed', audience: 'client' },
          { id: 'doc-2', title: 'Supplier contract', status: 'ready', internalOnly: true },
        ],
      },
      backupPlans: [{
        id: 'backup-1',
        trigger: 'Rain',
        clientFacing: 'Visit the gallery.',
        supplierNotes: 'SECRET-BACKUP-SUPPLIER',
      }],
      arbitraryRootField: 'SECRET-ROOT',
    });

    expect(Object.keys(snapshot)).toEqual([
      'version',
      'destination',
      'trip',
      'days',
      'exportMetadata',
      'bookingChecklist',
      'documentsChecklist',
      'backupPlans',
    ]);
    expect(snapshot.destination).toEqual({
      city: 'Edinburgh',
      country: 'Scotland, United Kingdom',
      countryCode: 'GB',
      currency: { code: 'GBP', symbol: 'Â£' },
    });
    expect(snapshot.trip).toEqual({
      totalDays: 3,
      summary: 'A client-safe overview.',
      travelStyle: 'culture',
      travelerProfile: {},
    });
    expect(snapshot.days[0].stops[0]).toEqual({
      id: 'stop-1',
      time: '10:00',
      name: 'Castle',
      description: 'Client-safe description.',
      duration: '2 hours',
    });
    expect(snapshot.bookingChecklist).toEqual([
      { id: 'book-1', task: 'Museum ticket', status: 'selected' },
    ]);
    expect(snapshot.documentsChecklist).toEqual([
      { id: 'doc-1', title: 'Travel document', status: 'needed', audience: 'client' },
    ]);
    expect(snapshot.backupPlans).toEqual([
      { id: 'backup-1', trigger: 'Rain', clientFacing: 'Visit the gallery.' },
    ]);

    const serialized = JSON.stringify(snapshot);
    for (const secret of [
      'SECRET-IBAN',
      'SECRET-CLIENT',
      'SECRET-TRIP-NOTE',
      'SECRET-PASSPORT',
      'SECRET-HEALTH',
      'SECRET-DAY-NOTE',
      'SECRET-SUPPLIER',
      'SECRET-BOOKING-REF',
      'supplier.example',
      'tracker.example',
      'SECRET-FUTURE',
      'SECRET-AGENCY-NOTE',
      'SECRET-BACKUP-SUPPLIER',
      'SECRET-ROOT',
    ]) {
      expect(serialized).not.toContain(secret);
    }
  });

  it('fails closed for invalid source values', () => {
    expect(buildPublicShareSnapshot(null)).toBeNull();
    expect(buildPublicShareSnapshot([])).toBeNull();
    expect(buildPublicShareSnapshot('encoded legacy data')).toBeNull();
  });
});
