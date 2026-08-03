'use client';

import React from 'react';
import styles from './WeatherSummary.module.css';

/**
 * WMO Weather Code → emoji + Portuguese label
 * @see https://open-meteo.com/en/docs#weathervariables
 */
const WMO_CODES = {
  0: { icon: '☀️', label: 'Céu limpo' },
  1: { icon: '🌤️', label: 'Pouco nublado' },
  2: { icon: '⛅', label: 'Parcialmente nublado' },
  3: { icon: '☁️', label: 'Nublado' },
  45: { icon: '🌫️', label: 'Nevoeiro' },
  48: { icon: '🌫️', label: 'Nevoeiro gelado' },
  51: { icon: '🌦️', label: 'Chuvisco leve' },
  53: { icon: '🌦️', label: 'Chuvisco moderado' },
  55: { icon: '🌧️', label: 'Chuvisco intenso' },
  61: { icon: '🌧️', label: 'Chuva leve' },
  63: { icon: '🌧️', label: 'Chuva moderada' },
  65: { icon: '🌧️', label: 'Chuva forte' },
  71: { icon: '🌨️', label: 'Neve leve' },
  73: { icon: '🌨️', label: 'Neve moderada' },
  75: { icon: '❄️', label: 'Neve forte' },
  80: { icon: '🌦️', label: 'Aguaceiros leves' },
  81: { icon: '🌧️', label: 'Aguaceiros moderados' },
  82: { icon: '⛈️', label: 'Aguaceiros violentos' },
  95: { icon: '⛈️', label: 'Trovoada' },
  96: { icon: '⛈️', label: 'Trovoada com granizo' },
  99: { icon: '⛈️', label: 'Trovoada com granizo forte' },
};

const getWeatherInfo = (code) => WMO_CODES[code] || { icon: '🌡️', label: 'Variável' };

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function WeatherStatusBadge({ status, dataType }) {
  if (dataType === 'weather_forecast' && status === 'available') {
    return <span className={`${styles.badge} ${styles.forecastAvailable}`}>Open-Meteo ✓</span>;
  }
  if (dataType === 'seasonal_climate_estimate') {
    return <span className={`${styles.badge} ${styles.climateEstimate}`}>Estimativa sazonal</span>;
  }
  return <span className={`${styles.badge} ${styles.unavailable}`}>Indisponível</span>;
}

/**
 * Renders verified weather data from Open-Meteo, clearly
 * distinguishing real forecasts from climate estimates.
 */
export default function WeatherSummary({ weatherData, activeDayIndex = 0 }) {
  if (!weatherData) return null;

  const { dataType, status, forecast, estimate, provenance } = weatherData;

  if (dataType === 'weather_forecast' && forecast?.daily) {
    const daily = forecast.daily;
    const dayCount = daily.time?.length || daily.temperature_2m_max?.length || 0;
    const idx = dayCount > 0 ? Math.max(0, Math.min(activeDayIndex, dayCount - 1)) : 0;
    const maxTemp = daily.temperature_2m_max?.[idx] ?? '--';
    const minTemp = daily.temperature_2m_min?.[idx] ?? '--';
    const precip = daily.precipitation_sum?.[idx] ?? 0;
    const code = daily.weathercode?.[idx];
    const info = getWeatherInfo(code);

    return (
      <div className={styles.weatherCard} data-testid="weather-forecast-card">
        <div className={styles.header}>
          <span className={styles.icon}>{info.icon}</span>
          <div className={styles.titles}>
            <h4>Previsão Meteorológica Real</h4>
            <span className={styles.attribution}>
              {provenance?.attribution || 'Fonte: Open-Meteo.com'}
            </span>
          </div>
          <WeatherStatusBadge status={status} dataType={dataType} />
        </div>
        <div className={styles.body}>
          <div className={styles.tempRange}>
            <span className={styles.max}>{maxTemp}°C</span>
            <span className={styles.min}> / {minTemp}°C</span>
          </div>
          <div className={styles.detail}>
            <span>{info.label}</span>
            {precip > 0 && <span> · {precip} mm</span>}
          </div>
        </div>
        {dayCount > 1 && (
          <div className={styles.forecastDays}>
            {daily.time.slice(0, Math.min(dayCount, 10)).map((dateStr, i) => {
              const date = new Date(dateStr + 'T00:00:00');
              const dayName = DAY_NAMES[date.getDay()];
              const dayInfo = getWeatherInfo(daily.weathercode?.[i]);
              const high = daily.temperature_2m_max?.[i];
              const low = daily.temperature_2m_min?.[i];
              const rain = daily.precipitation_sum?.[i] || 0;

              return (
                <div
                  key={dateStr}
                  className={`${styles.forecastDay} ${i === idx ? styles.active : ''}`}
                >
                  <span className={styles.forecastDayLabel}>{dayName}</span>
                  <span className={styles.forecastDayIcon}>{dayInfo.icon}</span>
                  <span className={styles.forecastDayTemp}>
                    {high != null ? `${Math.round(high)}°` : '--'}
                  </span>
                  {rain > 0.1 && (
                    <span className={styles.forecastDayPrecip}>{rain.toFixed(1)}mm</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (dataType === 'seasonal_climate_estimate') {
    return (
      <div className={styles.weatherCardEstimate} data-testid="weather-estimate-card">
        <div className={styles.header}>
          <span className={styles.icon}>📊</span>
          <div className={styles.titles}>
            <h4>Estimativa Climática Sazonal</h4>
            <p className={styles.estimateWarning}>
              Tendência sazonal geral. Não representa uma previsão diária em tempo real.
            </p>
          </div>
          <WeatherStatusBadge status={status} dataType={dataType} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.weatherCardUnavailable} data-testid="weather-unavailable-card">
      <span className={styles.icon}>⚠️</span>
      <p>Previsão meteorológica temporariamente indisponível.</p>
    </div>
  );
}
