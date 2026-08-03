import { describe, expect, it } from 'vitest';
import { migrateTripData } from '../app/lib/itinerary-store';

describe('Structured Geographic Persistence & Migration Suite', () => {
  it('migrates legacy string destinations without losing original text or hallucinating entities', () => {
    const legacyTrip = {
      id: 'trip-legacy-1',
      destination: 'Kyoto',
      dataVersion: 2,
    };

    const migrated = migrateTripData(legacyTrip);
    expect(migrated.dataVersion).toBe(4);
    expect(migrated.destinationText).toBe('Kyoto');
    expect(migrated.destinationEntity).toBeNull();
    expect(migrated.resolutionStatus).toBe('legacy_unresolved');
  });

  it('preserves structured geographic entity during trip migration', () => {
    const structuredTrip = {
      id: 'trip-structured-1',
      dataVersion: 3,
      destination: {
        entityId: 'geo-jp-tokyo',
        canonicalName: 'Tokyo',
        entityType: 'city',
        countryCode: 'JP',
        timezone: 'Asia/Tokyo',
        currencyCodes: ['JPY'],
        resolutionStatus: 'resolved',
      },
    };

    const migrated = migrateTripData(structuredTrip);
    expect(migrated.dataVersion).toBe(4);
    expect(migrated.destinationEntity).not.toBeNull();
    expect(migrated.destinationEntity.entityId).toBe('geo-jp-tokyo');
    expect(migrated.resolutionStatus).toBe('resolved');
  });
});
