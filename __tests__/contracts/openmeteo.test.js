import { describe, expect, it } from 'vitest';
import forecastFixture from '../fixtures/providers/openmeteo/forecast.json';

describe('Open-Meteo Contract Test Suite', () => {
  it('validates forecast contract structure, daily arrays, and timezone', () => {
    expect(forecastFixture).toHaveProperty('latitude');
    expect(forecastFixture).toHaveProperty('longitude');
    expect(forecastFixture).toHaveProperty('timezone');
    expect(forecastFixture).toHaveProperty('daily');

    const daily = forecastFixture.daily;
    expect(Array.isArray(daily.time)).toBe(true);
    expect(Array.isArray(daily.temperature_2m_max)).toBe(true);
    expect(daily.time.length).toBe(daily.temperature_2m_max.length);
  });
});
