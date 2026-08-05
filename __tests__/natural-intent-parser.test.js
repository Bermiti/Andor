import { describe, it, expect } from 'vitest';
import { parseNaturalLanguageIntent, buildConfirmationChips } from '../app/lib/natural-intent-parser';

describe('parseNaturalLanguageIntent', () => {
  it('handles complex Portuguese sentence correctly', () => {
    const text = 'Quero fazer uma viagem de 5 dias a Itália com a minha namorada em setembro, com boa comida, praias e sem gastar demasiado.';
    const result = parseNaturalLanguageIntent(text);

    expect(result.destination).toBe('Itália');
    expect(result.durationDays).toBe(5);
    expect(result.dates?.month).toBe('setembro');
    expect(result.travelers.type).toBe('couple');
    expect(result.budget.tier).toBe('economic');
    expect(result.interests.map((i) => i.id)).toContain('gastronomy');
    expect(result.interests.map((i) => i.id)).toContain('beach');
    expect(result.confidence.overall).toBeGreaterThan(0.6);
  });

  it('extracts Edinburgh 7 days family trip', () => {
    const text = 'Uma semana na Escócia em família com crianças e trilhos na natureza';
    const result = parseNaturalLanguageIntent(text);

    expect(result.destination).toBe('Escócia, Reino Unido');
    expect(result.durationDays).toBe(7);
    expect(result.travelers.type).toBe('family');
    expect(result.interests.map((i) => i.id)).toContain('nature');
  });

  it('extracts solo weekend in Tokyo', () => {
    const text = 'Fim de semana em Tóquio sozinho com cultura e museus';
    const result = parseNaturalLanguageIntent(text);

    expect(result.destination).toBe('Tóquio, Japão');
    expect(result.durationDays).toBe(3);
    expect(result.travelers.type).toBe('solo');
    expect(result.interests.map((i) => i.id)).toContain('culture');
  });

  it('provides safe defaults for empty or ambiguous text', () => {
    const result = parseNaturalLanguageIntent('');
    expect(result.destination).toBeNull();
    expect(result.durationDays).toBe(5);
    expect(result.travelers.type).toBe('couple');
    expect(result.confidence.overall).toBe(0);
  });
});

describe('buildConfirmationChips', () => {
  it('generates user-friendly chips from intent', () => {
    const intent = parseNaturalLanguageIntent('Viagem de 5 dias a Roma em casal com gastronomia');
    const chips = buildConfirmationChips(intent);

    expect(chips.length).toBeGreaterThan(0);
    expect(chips.find((c) => c.key === 'destination')?.label).toBe('Roma, Itália');
    expect(chips.find((c) => c.key === 'durationDays')?.label).toBe('5 dias');
    expect(chips.find((c) => c.key === 'travelers')?.label).toBe('Casal');
  });
});
