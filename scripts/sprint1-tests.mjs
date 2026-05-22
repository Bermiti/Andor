import validate from '../app/lib/itinerary-validate.js';
import { safeParse } from '../app/lib/safe-json.js';

function runTest(name, fn) {
  try {
    const res = fn();
    console.log(`=== ${name} ===`);
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.log(`=== ${name} ===`);
    console.error(e);
  }
}

// 1. Good Tokyo itinerary
const goodTokyo = {
  destination: 'Tokyo, Japan',
  trip: { title: 'Tokyo Quick Trip' },
  days: [
    { title: 'Arrival', activities: [{ name: 'Sensoji', coordinates: { lat: 35.7148, lng: 139.7967 } }] },
    { title: 'Sightseeing', activities: [{ name: 'Shibuya Crossing', coordinates: { lat: 35.6595, lng: 139.7005 } }] }
  ]
};

runTest('Good Tokyo itinerary', () => validate(goodTokyo));

// 2. Out-of-bounds coordinates
const badCoords = JSON.parse(JSON.stringify(goodTokyo));
badCoords.days[0].activities[0].coordinates = { lat: 40.0, lng: -3.0 };
runTest('Out-of-bounds coordinates', () => validate(badCoords));

// 3. Duplicate day titles
const dupTitles = JSON.parse(JSON.stringify(goodTokyo));
dupTitles.days[1].title = 'Arrival';
runTest('Duplicate day titles', () => validate(dupTitles));

// 4. Missing coordinates (should be filled with destination center)
const missingCoords = JSON.parse(JSON.stringify(goodTokyo));
delete missingCoords.days[0].activities[0].coordinates;
runTest('Missing coordinates', () => validate(missingCoords));

// 5. Malformed shared itinerary payload (simulate base64-decoded bad JSON)
const malformed = '{ this is : not json }';
const parsedMalformed = safeParse(malformed, null);
runTest('safeParse malformed JSON', () => ({ parsed: parsedMalformed }));

// 6. Safe parse valid JSON
runTest('safeParse valid JSON', () => ({ parsed: safeParse('[1,2,3]', []) }));

// 7. Legacy-ish itinerary normalization
const legacy = {
  city: 'Tokyo',
  startDate: '2026-05-22',
  days: [
    { dayTitle: 'Day One', stops: [{ title: 'Old Stop', location: { lat: '35.68', lng: '139.76' } }] }
  ]
};
runTest('Legacy itinerary normalization', () => validate(legacy));

// 8. Simulate corrupted saved trips/localStorage strings
const corruptSaved = 'not a json at all';
const safe = safeParse(corruptSaved, []);
runTest('Corrupt saved trips fallback', () => ({ safe }));

console.log('\nProgrammatic tests complete');
