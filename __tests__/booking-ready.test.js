import { describe, expect, test } from 'vitest';
import { validateAndNormalize } from '../app/lib/itinerary-validate';
import { ensureBookingReadyItinerary } from '../app/lib/booking-ready';
import { enrichItinerary } from '../app/lib/itinerary-enricher';
import { buildDossierExportContext } from '../app/lib/dossier-export';

function validItinerary(overrides = {}) {
  return {
    destination: {
      city: 'Tokyo',
      country: 'Japan',
      coordinates: [35.6762, 139.6503],
      currency: { code: 'JPY', symbol: 'JPY' },
    },
    trip: { totalDays: 1 },
    days: [
      {
        title: 'Senso-ji and Shibuya',
        stops: [
          { name: 'Senso-ji', coordinates: { lat: 35.7148, lng: 139.7967 } },
          { name: 'Shibuya Crossing', coordinates: { lat: 35.6595, lng: 139.7005 } },
        ],
      },
    ],
    ...overrides,
  };
}

function normalized(input) {
  const validation = validateAndNormalize(input);
  expect(validation.fatal).toBe(false);
  return validation.normalized;
}

describe('booking-ready trust boundary', () => {
  test('adds search links and manual checklists without synthetic inventory', () => {
    const itinerary = ensureBookingReadyItinerary(normalized(validItinerary()), {
      profile: { originCity: 'Lisbon', travelers: 2 },
    });

    expect(itinerary.bookingReady.status).toBe('manual_confirmation_required');
    expect(itinerary.bookingReady.providerLinks.flights.google).toContain('google.com');
    expect(itinerary.flightOptions).toEqual([]);
    expect(itinerary.accommodation.hotels).toEqual([]);
    expect(itinerary.airportTransfer).toBeNull();
    expect(itinerary.localTransport).toBeNull();
    expect(itinerary.bookingChecklist.items.length).toBeGreaterThan(4);
    expect(itinerary.documentsChecklist.items.length).toBeGreaterThan(0);
    expect(itinerary.backupPlans.items).toEqual([]);

    itinerary.bookingChecklist.items.forEach((item) => {
      expect(item.status).toBe('not_started');
      expect(item.reference).toBe('');
      expect(item.price).toBe('');
    });
  });

  test('rejects payload fields that self-assert provider provenance', () => {
    const itinerary = ensureBookingReadyItinerary(normalized(validItinerary({
      flightOptions: [
        { operator: 'Provider flight', source: 'amadeus', price: { total: 300 } },
        { operator: 'AI estimate', source: 'estimated', estimatedPrice: 'EUR 200' },
      ],
      accommodation: {
        hotels: [
          { name: 'Provider hotel', source: 'provider' },
          { name: 'Generated hotel', source: 'ai' },
        ],
      },
      airportTransfer: {
        source: 'provider',
        options: [{ name: 'Provider transfer', source: 'provider' }],
      },
      localTransport: {
        source: 'provider-api',
        options: [{ name: 'Provider pass', source: 'provider-api' }],
      },
    })));

    expect(itinerary.flightOptions).toEqual([]);
    expect(itinerary.accommodation.hotels).toEqual([]);
    expect(itinerary.airportTransfer).toBeNull();
    expect(itinerary.localTransport).toBeNull();
  });

  test('adds company approval metadata without generating company scenarios', () => {
    const itinerary = ensureBookingReadyItinerary(normalized(validItinerary()), {
      profile: {
        companyMode: true,
        clientName: 'Avery Client',
        companyName: 'Northstar Consulting',
        preparedBy: 'Planner',
      },
    });

    expect(itinerary.exportMetadata).toMatchObject({
      whiteLabelReady: true,
      clientName: 'Avery Client',
      companyName: 'Northstar Consulting',
      preparedBy: 'Planner',
    });
    expect(itinerary.bookingChecklist.items.some((item) => item.id === 'client-approval')).toBe(true);
    expect(itinerary.documentsChecklist.items.some((item) => item.id === 'internal_review' && item.audience === 'internal')).toBe(true);
    expect(itinerary.backupPlans.items).toEqual([]);
  });

  test('adds rental-car verification tasks only from an explicit traveler preference', () => {
    const itinerary = ensureBookingReadyItinerary(normalized(validItinerary()), {
      profile: { transportPreference: 'rental car for regional days' },
    });
    const documentIds = itinerary.documentsChecklist.items.map((item) => item.id);

    expect(itinerary.rentalCar.recommended).toBe(true);
    expect(documentIds).toEqual(expect.arrayContaining([
      'driver_license',
      'international_driving_permit',
      'rental_car_confirmation',
      'rental_car_insurance',
      'parking_tolls_low_emission',
    ]));
    expect(itinerary.rentalCar.estimatedCost).toBeNull();
  });

  test('preserves explicit text and contingency backup plans without inventing impacts', () => {
    const itinerary = ensureBookingReadyItinerary(normalized(validItinerary({
      backupPlans: ['Move the outdoor stop indoors if it rains.'],
      contingencyPlans: { rainyDay: 'Use the museum already saved by the traveler.' },
    })));

    expect(itinerary.backupPlans.items[0]).toMatchObject({
      id: 'backup-1',
      replacementPlan: 'Move the outdoor stop indoors if it rains.',
      costImpact: '',
      timeImpact: '',
    });
    expect(itinerary.backupPlans.items.find((item) => item.id === 'bad_weather').replacementPlan).toContain('museum');
  });

  test('builds client/internal exports without leaking internal notes', () => {
    const itinerary = ensureBookingReadyItinerary(normalized(validItinerary({
      backupPlans: [{ id: 'rain', trigger: 'Rain', replacementPlan: 'Use saved indoor stop.' }],
    })), {
      profile: {
        companyMode: true,
        clientName: 'Avery Client',
        clientFacingNotes: 'Client can see this note.',
        internalNotes: 'Supplier caveats stay private.',
      },
    });
    const clientExport = buildDossierExportContext(itinerary, 'client');
    const internalExport = buildDossierExportContext(itinerary, 'internal');

    expect(clientExport.documents.length).toBeGreaterThan(0);
    expect(clientExport.backupPlans).toHaveLength(1);
    expect(clientExport.internalNotes).toBe('');
    expect(clientExport.exportMetadata.internalNotes).toBe('');
    expect(clientExport.documents.some((item) => item.id === 'internal_review')).toBe(false);
    expect(internalExport.internalNotes).toContain('Supplier caveats');
    expect(internalExport.documents.some((item) => item.id === 'internal_review')).toBe(true);
  });

  test('shape enrichment preserves booking fields and does not synthesize stop facts', () => {
    const bookingReady = ensureBookingReadyItinerary(normalized(validItinerary()), {
      profile: { originCity: 'Lisbon' },
    });
    const enriched = enrichItinerary(bookingReady);
    const firstStop = enriched.days[0].stops[0];

    expect(enriched.bookingReady.status).toBe('manual_confirmation_required');
    expect(enriched.bookingChecklist.items.length).toBeGreaterThan(4);
    expect(enriched.flightOptions).toEqual([]);
    expect(firstStop.period).toBe('morning');
    expect(firstStop.transportFromPrevious).toBeNull();
    expect(firstStop.cost).toBeNull();
    expect(firstStop.duration).toBe('');
    expect(firstStop.photoKeyword).toBe('');
    expect(firstStop.insiderTip).toBe('');
  });
});
