import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTravelPersona,
  updateTravelPersona,
  recordPersonaSignal,
  resetTravelPersona,
  applyPersonaToGenerationPayload,
  summarizePersonaForUser,
  DEFAULT_PERSONA,
} from '../app/lib/travel-persona';

describe('travel persona engine v2 — mandatory user isolation & generation lifecycle', () => {
  beforeEach(() => {
    resetTravelPersona('user-1');
    resetTravelPersona('user-2');
    resetTravelPersona(null);
  });

  it('1-4. creates persona with calm pace, gastronomy, rejects nightlife, and saves', () => {
    updateTravelPersona({ pace: 'relaxed', budgetTier: 'economic', interests: ['gastronomy'] }, 'user-1');
    recordPersonaSignal('activity_rejected', { category: 'nightlife' }, 'user-1');

    const persona = getTravelPersona('user-1');
    expect(persona.pace).toBe('relaxed');
    expect(persona.budgetTier).toBe('economic');
    expect(persona.interests).toContain('gastronomy');
    expect(persona.learnedTraits.rejectedCategories).toContain('nightlife');
  });

  it('5-6. isolates user accounts (user-1 vs user-2)', () => {
    updateTravelPersona({ pace: 'relaxed' }, 'user-1');
    updateTravelPersona({ pace: 'fast' }, 'user-2');

    expect(getTravelPersona('user-1').pace).toBe('relaxed');
    expect(getTravelPersona('user-2').pace).toBe('fast');
  });

  it('7-8. applies learned persona preferences to generation payload for user second trip', () => {
    updateTravelPersona({ pace: 'relaxed', budgetTier: 'economic', interests: ['gastronomy'] }, 'user-1');
    recordPersonaSignal('activity_rejected', { category: 'nightlife' }, 'user-1');

    const basePayload = { destination: 'Roma, Itália', days: 5 };
    const merged = applyPersonaToGenerationPayload(basePayload, 'user-1');

    expect(merged.travelStyle).toBe('relaxed');
    expect(merged.budgetTier).toBe('economic');
    expect(merged.stylesList).toContain('gastronomy');
    expect(merged.excludedCategories).toContain('nightlife');
  });

  it('9-10. allows trip-specific overrides without mutating global persona profile', () => {
    updateTravelPersona({ pace: 'relaxed', budgetTier: 'economic' }, 'user-1');

    // Trip-specific override: fast pace for a 3-day weekend trip
    const basePayload = { destination: 'Paris, França', days: 3, travelStyle: 'fast' };
    const merged = applyPersonaToGenerationPayload(basePayload, 'user-1');

    expect(merged.travelStyle).toBe('fast'); // Overridden for this trip
    expect(merged.budgetTier).toBe('economic'); // Inherited from persona

    // Confirm global persona remains relaxed
    expect(getTravelPersona('user-1').pace).toBe('relaxed');
  });

  it('11-12. resets profile cleanly and removes all inferences', () => {
    updateTravelPersona({ pace: 'fast' }, 'user-1');
    recordPersonaSignal('activity_rejected', { category: 'museum' }, 'user-1');

    resetTravelPersona('user-1');
    const clean = getTravelPersona('user-1');

    expect(clean.pace).toBe(DEFAULT_PERSONA.pace);
    expect(clean.learnedTraits.rejectedCategories).toEqual([]);
    expect(clean.learnedTraits.interactionCount).toBe(0);
  });
});
