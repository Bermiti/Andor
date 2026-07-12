import { describe, expect, test } from 'vitest';
import { generateFallbackItinerary } from '../app/lib/fallback-ai';
import { validateAndNormalize } from '../app/lib/itinerary-validate';
import { ensureBookingReadyItinerary } from '../app/lib/booking-ready';
import { enrichItinerary } from '../app/lib/itinerary-enricher';
import { buildDossierExportContext } from '../app/lib/dossier-export';

describe('booking-ready itinerary normalization', () => {
  test('adds booking-ready sections to fallback itineraries', () => {
    const fallback = generateFallbackItinerary('Lisbon, Portugal', 3, 'comfort');
    const validation = validateAndNormalize(fallback);
    const itinerary = ensureBookingReadyItinerary(validation.normalized, {
      profile: {
        originCity: 'Porto',
        travelers: 2,
        budgetIncludesFlights: 'unknown',
      },
    });

    expect(itinerary.bookingReady.status).toBe('manual_confirmation_required');
    expect(itinerary.bookingReady.providerLinks.flights.google).toContain('google.com');
    expect(itinerary.flightOptions.length).toBeGreaterThan(0);
    expect(itinerary.accommodation.hotels.length).toBeGreaterThanOrEqual(3);
    expect(itinerary.airportTransfer.options.length).toBeGreaterThanOrEqual(3);
    expect(itinerary.localTransport.apps.length).toBeGreaterThan(0);
    expect(itinerary.documentsChecklist.items.length).toBeGreaterThan(0);
    expect(itinerary.documentsChecklist.items[0]).toMatchObject({
      title: expect.any(String),
      importance: expect.stringMatching(/required|recommended|optional/),
      whoNeedsIt: expect.any(String),
      timing: expect.any(String),
      status: expect.stringMatching(/not_started|needed|ready|uploaded_confirmed|not_applicable/),
      sourceReason: expect.any(String),
    });
    expect(itinerary.backupPlans.items.length).toBeGreaterThanOrEqual(8);
    expect(itinerary.backupPlans.items[0]).toMatchObject({
      trigger: expect.any(String),
      replacementPlan: expect.any(String),
      costImpact: expect.any(String),
      timeImpact: expect.any(String),
      moveOrCancel: expect.any(String),
      clientFacing: expect.any(String),
    });
    expect(itinerary.bookingChecklist.items.some((item) => item.category === 'flights')).toBe(true);
  });

  test('keeps every generated booking task manual by default', () => {
    const fallback = generateFallbackItinerary('Tokyo, Japan', 2, 'premium');
    const validation = validateAndNormalize(fallback);
    const itinerary = ensureBookingReadyItinerary(validation.normalized, {
      profile: { originCity: 'Lisbon', travelers: 2 },
    });

    expect(itinerary.bookingChecklist.items.length).toBeGreaterThan(4);
    itinerary.bookingChecklist.items.forEach((item) => {
      expect(item.status).toBe('not_started');
      expect(item.reference).toBe('');
      expect(item.price).toBe('');
    });
  });

  test('adds company approval and export metadata when company mode is enabled', () => {
    const fallback = generateFallbackItinerary('Paris, France', 2, 'comfort');
    const validation = validateAndNormalize(fallback);
    const itinerary = ensureBookingReadyItinerary(validation.normalized, {
      profile: {
        companyMode: true,
        clientName: 'Avery Client',
        companyName: 'Northstar Consulting',
        preparedBy: 'Andor Concierge',
      },
    });

    expect(itinerary.exportMetadata.whiteLabelReady).toBe(true);
    expect(itinerary.exportMetadata.clientName).toBe('Avery Client');
    expect(itinerary.bookingChecklist.items.some((item) => item.id === 'client-approval')).toBe(true);
    expect(itinerary.documentsChecklist.items.some((item) => item.id === 'approval')).toBe(true);
    expect(itinerary.documentsChecklist.items.some((item) => item.id === 'company_budget_approval')).toBe(true);
    expect(itinerary.documentsChecklist.items.some((item) => item.id === 'client_itinerary_approval')).toBe(true);
    expect(itinerary.documentsChecklist.items.some((item) => item.id === 'internal_review' && item.audience === 'internal')).toBe(true);
    expect(itinerary.backupPlans.items.some((item) => item.id === 'company_schedule_change')).toBe(true);
  });

  test('adds rental-car document reminders and no-car backup when driving is recommended', () => {
    const fallback = generateFallbackItinerary('Madeira, Portugal', 5, 'comfort');
    const validation = validateAndNormalize(fallback);
    const itinerary = ensureBookingReadyItinerary(validation.normalized, {
      profile: {
        originCity: 'Porto',
        transportPreference: 'rental car for regional days',
      },
    });
    const documentIds = itinerary.documentsChecklist.items.map((item) => item.id);

    expect(itinerary.rentalCar.recommended).toBe(true);
    expect(documentIds).toContain('driver_license');
    expect(documentIds).toContain('international_driving_permit');
    expect(documentIds).toContain('rental_car_confirmation');
    expect(documentIds).toContain('rental_car_insurance');
    expect(documentIds).toContain('parking_tolls_low_emission');
    expect(itinerary.backupPlans.items.some((item) => item.id === 'no_rental_car')).toBe(true);
  });

  test('normalizes text-only backup plans into structured backup items', () => {
    const fallback = generateFallbackItinerary('Lisbon, Portugal', 2, 'comfort');
    const validation = validateAndNormalize({
      ...fallback,
      backupPlans: ['Move everything indoors if it rains.'],
      contingencyPlans: {
        rainyDay: 'Use museums and covered markets.',
        delayRecovery: 'Move the first evening walk after dinner.',
      },
    });
    const itinerary = ensureBookingReadyItinerary(validation.normalized);

    expect(itinerary.backupPlans.items.some((item) => item.id === 'backup-note-1')).toBe(true);
    expect(itinerary.backupPlans.items.find((item) => item.id === 'bad_weather').replacementPlan).toContain('museums');
    expect(itinerary.contingencyPlans.rainyDay).toContain('museums');
  });

  test('builds client and internal export contexts without leaking internal notes', () => {
    const fallback = generateFallbackItinerary('Tokyo, Japan', 3, 'premium');
    const validation = validateAndNormalize(fallback);
    const itinerary = ensureBookingReadyItinerary(validation.normalized, {
      profile: {
        companyMode: true,
        clientName: 'Avery Client',
        clientFacingNotes: 'Client can see this note.',
        internalNotes: 'Margin and supplier caveats stay private.',
      },
    });
    const clientExport = buildDossierExportContext(itinerary, 'client');
    const internalExport = buildDossierExportContext(itinerary, 'internal');

    expect(clientExport.documents.length).toBeGreaterThan(0);
    expect(clientExport.backupPlans.length).toBeGreaterThan(0);
    expect(clientExport.internalNotes).toBe('');
    expect(clientExport.exportMetadata.internalNotes).toBe('');
    expect(clientExport.documents.some((item) => item.id === 'internal_review')).toBe(false);
    expect(internalExport.internalNotes).toContain('supplier caveats');
    expect(internalExport.documents.some((item) => item.id === 'internal_review')).toBe(true);
  });

  test('keeps booking-ready fields after itinerary enrichment', () => {
    const fallback = generateFallbackItinerary('Lisbon, Portugal', 2, 'comfort');
    const validation = validateAndNormalize(fallback);
    const bookingReady = ensureBookingReadyItinerary(validation.normalized, {
      profile: {
        originCity: 'Porto',
        companyMode: true,
        clientName: 'Avery Client',
      },
    });
    const enriched = enrichItinerary(bookingReady);

    expect(enriched.bookingReady.status).toBe('manual_confirmation_required');
    expect(enriched.bookingChecklist.items.length).toBeGreaterThan(4);
    expect(enriched.documentsChecklist.items.length).toBeGreaterThan(0);
    expect(enriched.flightOptions.length).toBeGreaterThan(0);
    expect(enriched.exportMetadata.clientName).toBe('Avery Client');
  });

  test('keeps structured day logistics after itinerary enrichment', () => {
    const fallback = generateFallbackItinerary('Tokyo, Japan', 3, 'comfort');
    const validation = validateAndNormalize(fallback);
    const bookingReady = ensureBookingReadyItinerary(validation.normalized, {
      profile: { originCity: 'Lisbon', travelers: 2 },
    });
    const enriched = enrichItinerary(bookingReady);
    const firstDay = enriched.days[0];

    expect(firstDay.periods.morning.activities.length).toBeGreaterThan(0);
    expect(firstDay.periods.afternoon.activities.length).toBeGreaterThan(0);
    expect(firstDay.stops[0].period).toBe('morning');
    expect(firstDay.stops[0].transportFromPrevious.duration).toBeTruthy();
    expect(firstDay.stops[0].photoKeyword).toContain(firstDay.stops[0].name);
    expect(firstDay.stops[0].backupOption).toBeTruthy();
    expect(firstDay.stops[0].practicalNote).toBeTruthy();
  });
});
