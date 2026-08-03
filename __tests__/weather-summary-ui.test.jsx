import { describe, expect, it } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import WeatherSummary from '../app/components/WeatherSummary';

describe('WeatherSummary UI Component Test Suite', () => {
  it('renders forecast available state with Open-Meteo attribution', () => {
    const weatherData = {
      dataType: 'weather_forecast',
      status: 'available',
      forecast: {
        daily: {
          temperature_2m_max: [22],
          temperature_2m_min: [14],
          precipitation_sum: [0],
        },
      },
      provenance: {
        attribution: 'Weather forecast data by Open-Meteo.com',
      },
    };

    render(<WeatherSummary weatherData={weatherData} />);
    expect(screen.getByTestId('weather-forecast-card')).toBeDefined();
    expect(screen.getByText('Previsão Meteorológica Real')).toBeDefined();
    expect(screen.getByText('22°C')).toBeDefined();
  });

  it('renders seasonal estimate warning state distinctly without presenting it as live forecast', () => {
    const weatherData = {
      dataType: 'seasonal_climate_estimate',
      status: 'estimate_only',
      estimate: { season: 'summer' },
    };

    render(<WeatherSummary weatherData={weatherData} />);
    expect(screen.getByTestId('weather-estimate-card')).toBeDefined();
    expect(screen.getByText('Estimativa Climática Sazonal')).toBeDefined();
    expect(screen.getByText(/Tendência sazonal geral/i)).toBeDefined();
  });

  it('renders fallback card when provider is unavailable', () => {
    const weatherData = {
      dataType: 'unavailable',
      status: 'provider_unavailable',
    };

    render(<WeatherSummary weatherData={weatherData} />);
    expect(screen.getByTestId('weather-unavailable-card')).toBeDefined();
    expect(screen.getByText(/temporariamente indisponível/i)).toBeDefined();
  });
});
