import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTravelPersona,
  updateTravelPersona,
  recordPersonaSignal,
  resetTravelPersona,
  summarizePersonaForUser,
  DEFAULT_PERSONA,
} from '../app/lib/travel-persona';

describe('travel persona engine', () => {
  beforeEach(() => {
    resetTravelPersona();
  });

  it('returns default persona initially', () => {
    const persona = getTravelPersona();
    expect(persona.pace).toBe('balanced');
    expect(persona.budgetTier).toBe('moderate');
  });

  it('updates explicit persona preferences', () => {
    const updated = updateTravelPersona({ pace: 'relaxed', budgetTier: 'economic', interests: ['gastronomy', 'beach'] });
    expect(updated.pace).toBe('relaxed');
    expect(updated.budgetTier).toBe('economic');
    expect(updated.interests).toEqual(['gastronomy', 'beach']);
  });

  it('records interaction signals transparently', () => {
    recordPersonaSignal('activity_rejected', { category: 'museum' });
    const current = getTravelPersona();
    expect(current.learnedTraits.rejectedCategories).toContain('museum');
    expect(current.learnedTraits.interactionCount).toBe(1);
  });

  it('generates human readable summary bullets', () => {
    updateTravelPersona({ pace: 'relaxed', budgetTier: 'economic' });
    const summary = summarizePersonaForUser();
    expect(summary.length).toBeGreaterThan(0);
    expect(summary[0].text).toContain('descontraído');
  });

  it('resets persona state clean', () => {
    updateTravelPersona({ pace: 'fast' });
    resetTravelPersona();
    const clean = getTravelPersona();
    expect(clean.pace).toBe(DEFAULT_PERSONA.pace);
  });
});
