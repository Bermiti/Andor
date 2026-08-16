import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readProjectFile = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('itinerary generation trust boundary', () => {
  it('keeps the generation prompt aligned with the data trust taxonomy', () => {
    const source = readProjectFile('app/api/generate-itinerary/route.js');

    expect(source).toContain('DATA TRUST TAXONOMY');
    expect(source).toContain('The model may never self-declare a fact verified.');
    expect(source).toContain('Never calculate, estimate, or copy coordinates from an example.');
    expect(source).not.toContain('Know major hub connections and realistic prices');
    expect(source).not.toContain('Cash vs card policy');
    expect(source).not.toContain('Specific metro/bus lines with numbers');
    expect(source).not.toContain('Use this exact structure:');
    expect(source).not.toMatch(/Ã|Â|â/);
  });

  it('applies the same coordinate boundary when a single day is regenerated', () => {
    const source = readProjectFile('app/api/regenerate-day/route.js');

    expect(source).toContain('verifyActivityCoordinates');
    expect(source).toContain('Return coordinates=null.');
    expect(source).not.toContain('Make sure coordinates are geographically accurate.');
    expect(source).not.toContain('[lat, lng]');
  });

  it('does not claim that proposed activities are already verified while loading', () => {
    const source = readProjectFile('app/components/CreationExperience.js');
    expect(source).not.toContain('atividades verificadas');
    expect(source).toContain('A gerar uma proposta');
  });

  it('keeps storage hydration shape-only with no unreachable synthetic enrichment', () => {
    const source = readProjectFile('app/lib/itinerary-store.js');
    const hydrationFunction = source.slice(
      source.indexOf('export function enrichItineraryData'),
      source.indexOf('export function saveGeneratedItinerary'),
    );

    expect(hydrationFunction).not.toContain('coordsLookup');
    expect(hydrationFunction).not.toContain('estimatedCost');
    expect(hydrationFunction.match(/return enriched;/g)).toHaveLength(1);
  });
});
