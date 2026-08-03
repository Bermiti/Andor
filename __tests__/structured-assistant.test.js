// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { executeStructuredAssistantOperation } from '../app/lib/server/structured-assistant';

describe('Structured Assistant Test Suite (Sprint 6)', () => {
  it('executes adapt_to_weather operation while preserving locked activities', () => {
    const itinerary = {
      version: 1,
      days: [
        {
          activities: [
            { id: 'act-1', name: 'Passeio no Jardim da Estrela', isOutdoor: true, locked: false },
            { id: 'act-2', name: 'Museu do Calouste Gulbenkian', isOutdoor: false, locked: true },
          ],
        },
      ],
    };

    const res = executeStructuredAssistantOperation(itinerary, { action: 'adapt_to_weather', targetDayIndex: 0 });
    expect(res.success).toBe(true);
    expect(res.itinerary.version).toBe(2);

    const updatedStops = res.itinerary.days[0].activities;
    expect(updatedStops[0].adaptedForRain).toBe(true);
    expect(updatedStops[1].locked).toBe(true);
    expect(updatedStops[1].adaptedForRain).toBeUndefined();
  });

  it('rejects attempt to swap a locked activity', () => {
    const itinerary = {
      version: 1,
      days: [
        {
          activities: [
            { id: 'act-locked-1', name: 'Jantar Reservado', locked: true },
          ],
        },
      ],
    };

    const command = {
      action: 'swap_activity',
      targetDayIndex: 0,
      targetActivityId: 'act-locked-1',
      alternativeCandidate: { id: 'alt-1', name: 'Novo Jantar' },
    };

    expect(() => executeStructuredAssistantOperation(itinerary, command)).toThrow(/is locked and cannot be swapped/);
  });
});
