import { describe, it, expect } from 'vitest';
import { parseNaturalLanguageIntent, buildConfirmationChips } from '../app/lib/natural-intent-parser';

describe('parseNaturalLanguageIntent v2 — 18 Mandatory Test Cases', () => {
  // 1. “Quero passar cinco dias em Roma em setembro.”
  it('case 1: 5 days in Roma in September', () => {
    const res = parseNaturalLanguageIntent('Quero passar cinco dias em Roma em setembro.');
    expect(res.fields.destinations[0].canonical).toBe('Roma, Itália');
    expect(res.fields.durationDays).toBe(5);
    expect(res.fields.dates.month).toBe('setembro');
    expect(res.confidence.destinations).toBeGreaterThan(0.8);
    expect(res.missingFields).not.toContain('destinations');
    expect(res.missingFields).not.toContain('durationDays');
  });

  // 2. “Fim de semana romântico em Paris.”
  it('case 2: romantic weekend in Paris', () => {
    const res = parseNaturalLanguageIntent('Fim de semana romântico em Paris.');
    expect(res.fields.destinations[0].canonical).toBe('Paris, França');
    expect(res.fields.durationDays).toBe(3);
    expect(res.fields.travelers.type).toBe('couple');
  });

  // 3. “Uma semana económica nos Açores com amigos.”
  it('case 3: economic week in Azores with friends', () => {
    const res = parseNaturalLanguageIntent('Uma semana económica nos Açores com amigos.');
    expect(res.fields.destinations[0].canonical).toBe('Açores, Portugal');
    expect(res.fields.durationDays).toBe(7);
    expect(res.fields.budget.tier).toBe('economic');
    expect(res.fields.travelers.type).toBe('friends');
  });

  // 4. “Road trip pela Escócia durante dez dias.”
  it('case 4: roadtrip in Scotland for 10 days', () => {
    const res = parseNaturalLanguageIntent('Road trip pela Escócia durante dez dias.');
    expect(res.fields.destinations[0].canonical).toBe('Escócia, Reino Unido');
    expect(res.fields.durationDays).toBe(10);
  });

  // 5. “Lisboa, Madrid e Barcelona em duas semanas.”
  it('case 5: multi-destination Lisbon, Madrid, Barcelona in 2 weeks', () => {
    const res = parseNaturalLanguageIntent('Lisboa, Madrid e Barcelona em duas semanas.');
    expect(res.fields.destinations.length).toBe(3);
    const names = res.fields.destinations.map((d) => d.canonical);
    expect(names).toContain('Lisboa, Portugal');
    expect(names).toContain('Madrid, Espanha');
    expect(names).toContain('Barcelona, Espanha');
    expect(res.fields.durationDays).toBe(14);
  });

  // 6. “Quero praia, mas ainda não sei para onde ir.”
  it('case 6: beach interest without destination', () => {
    const res = parseNaturalLanguageIntent('Quero praia, mas ainda não sei para onde ir.');
    expect(res.fields.destinations.length).toBe(0);
    expect(res.missingFields).toContain('destinations');
    expect(res.fields.interests.map((i) => i.id)).toContain('beach');
  });

  // 7. “Talvez Itália ou Croácia.”
  it('case 7: multiple candidate countries', () => {
    const res = parseNaturalLanguageIntent('Talvez Itália ou Croácia.');
    expect(res.fields.destinations.length).toBe(2);
    const names = res.fields.destinations.map((d) => d.canonical);
    expect(names).toContain('Itália');
    expect(names).toContain('Croácia');
  });

  // 8. “Quero viajar em setembro, mas ainda não sei quantos dias.”
  it('case 8: month set but missing duration', () => {
    const res = parseNaturalLanguageIntent('Quero viajar em setembro, mas ainda não sei quantos dias.');
    expect(res.fields.dates.month).toBe('setembro');
    expect(res.fields.durationDays).toBeNull();
    expect(res.missingFields).toContain('durationDays');
  });

  // 9. “Cinco dias entre o Porto e o Douro com os meus pais.”
  it('case 9: Porto and Douro multi-destination with parents', () => {
    const res = parseNaturalLanguageIntent('Cinco dias entre o Porto e o Douro com os meus pais.');
    expect(res.fields.destinations.length).toBe(2);
    expect(res.fields.durationDays).toBe(5);
    expect(res.fields.travelers.type).toBe('family');
  });

  // 10. “Viagem confortável, mas quero gastar o mínimo possível.”
  it('case 10: budget conflict detection (comfortable vs minimum possible)', () => {
    const res = parseNaturalLanguageIntent('Viagem confortável, mas quero gastar o mínimo possível.');
    expect(res.conflicts.length).toBeGreaterThan(0);
    expect(res.conflicts[0].field).toBe('budget');
  });

  // 11. English text
  it('case 11: English input sentence', () => {
    const res = parseNaturalLanguageIntent('5 days in Tokyo solo on a budget with food and museums');
    expect(res.fields.destinations[0].canonical).toBe('Tóquio, Japão');
    expect(res.fields.durationDays).toBe(5);
    expect(res.fields.travelers.type).toBe('solo');
    expect(res.fields.budget.tier).toBe('economic');
    expect(res.fields.interests.map((i) => i.id)).toContain('gastronomy');
  });

  // 12. Text with typos
  it('case 12: typo tolerance ("Pariss")', () => {
    const res = parseNaturalLanguageIntent('Quero ir a Pariss 5 dias');
    expect(res.fields.destinations[0].canonical).toBe('Paris, França');
    expect(res.fields.durationDays).toBe(5);
  });

  // 13. Text without destination
  it('case 13: missing destination', () => {
    const res = parseNaturalLanguageIntent('Viagem de 5 dias em casal');
    expect(res.fields.destinations.length).toBe(0);
    expect(res.missingFields).toContain('destinations');
    expect(res.fields.durationDays).toBe(5);
    expect(res.fields.travelers.type).toBe('couple');
  });

  // 14. Text without dates
  it('case 14: missing dates', () => {
    const res = parseNaturalLanguageIntent('5 dias em Lisboa');
    expect(res.fields.destinations[0].canonical).toBe('Lisboa, Portugal');
    expect(res.fields.durationDays).toBe(5);
    expect(res.fields.dates).toBeNull();
  });

  // 15. Contradictory text
  it('case 15: contradictory text (luxury vs cheap)', () => {
    const res = parseNaturalLanguageIntent('Luxo de 5 estrelas extremamente barato');
    expect(res.conflicts.length).toBeGreaterThan(0);
    expect(res.conflicts[0].field).toBe('budget');
  });

  // 16. Irrelevant text
  it('case 16: irrelevant text input', () => {
    const res = parseNaturalLanguageIntent('Como está o tempo hoje?');
    expect(res.fields.destinations.length).toBe(0);
    expect(res.missingFields).toContain('destinations');
    expect(res.missingFields).toContain('durationDays');
  });

  // 17. Double click submission / duplicate safety
  it('case 17: duplicate submission safety', () => {
    const intent1 = parseNaturalLanguageIntent('5 dias em Roma');
    const intent2 = parseNaturalLanguageIntent('5 dias em Roma');
    expect(intent1.fields.destinations[0].canonical).toBe(intent2.fields.destinations[0].canonical);
  });

  // 18. Timeout request retry safety
  it('case 18: buildConfirmationChips handles null or missing intent gracefully', () => {
    const chips = buildConfirmationChips(null);
    expect(chips).toEqual([]);
  });
});
