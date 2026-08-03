import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { GET } from '../app/api/autocomplete/route';

describe('Structured Autocomplete API Route Test Suite', () => {
  it('returns empty array when query is too short or missing', async () => {
    const req = new Request('http://localhost:3000/api/autocomplete?q=a');
    const res = await GET(req);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it('returns structured geographic entities with resolutionStatus and provenance', async () => {
    const req = new Request('http://localhost:3000/api/autocomplete?q=Esc%C3%B3cia');
    const res = await GET(req);
    const body = await res.json();

    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    const scotland = body[0];
    expect(scotland.canonicalName).toBe('Scotland');
    expect(scotland.countryCode).toBe('GB');
    expect(scotland.resolutionStatus).toBe('resolved');
    expect(scotland.provenance).toBeDefined();
    expect(scotland.provenance.sourceType).toBe('official');
  });
});
