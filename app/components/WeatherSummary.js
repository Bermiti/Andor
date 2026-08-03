'use client';

import React from 'react';
import styles from './WeatherSummary.module.css';

export function WeatherStatusBadge({ status, dataType }) {
  if (dataType === 'weather_forecast' && status === 'available') {
    return <span className={`${styles.badge} ${styles.forecastAvailable}`}>Previsão Diária Verificada</span>;
  }
  if (dataType === 'seasonal_climate_estimate') {
    return <span className={`${styles.badge} ${styles.climateEstimate}`}>Tendência Sazonal Indicativa</span>;
  }
  return <span className={`${styles.badge} ${styles.unavailable}`}>Sem Dados Meteorológicos</span>;
}

export default function WeatherSummary({ weatherData }) {
  if (!weatherData) return null;

  const { dataType, status, forecast, estimate, provenance } = weatherData;

  if (dataType === 'weather_forecast' && forecast?.daily) {
    const maxTemp = forecast.daily.temperature_2m_max?.[0] ?? '--';
    const minTemp = forecast.daily.temperature_2m_min?.[0] ?? '--';
    const precip = forecast.daily.precipitation_sum?.[0] ?? 0;

    return (
      <div className={styles.weatherCard} data-testid="weather-forecast-card">
        <div className={styles.header}>
          <span className={styles.icon}>⛅</span>
          <div className={styles.titles}>
            <h4>Previsão Meteorológica Real</h4>
            <span className={styles.attribution}>{provenance?.attribution || 'Fonte: Open-Meteo'}</span>
          </div>
          <WeatherStatusBadge status={status} dataType={dataType} />
        </div>
        <div className={styles.body}>
          <div className={styles.tempRange}>
            <span className={styles.max}>{maxTemp}°C</span>
            <span className={styles.min}>/ {minTemp}°C</span>
          </div>
          <div className={styles.detail}>
            <span>Precipitação: {precip} mm</span>
          </div>
        </div>
      </div>
    );
  }

  if (dataType === 'seasonal_climate_estimate') {
    return (
      <div className={styles.weatherCardEstimate} data-testid="weather-estimate-card">
        <div className={styles.header}>
          <span className={styles.icon}>📊</span>
          <div>
            <h4>Estimativa Climática Sazonal</h4>
            <p className={styles.estimateWarning}>
              Tendência sazonal geral. Não representa uma previsão diária em tempo real para as datas da viagem.
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
      <p>Previsão meteorológica temporariamente indisponível. O itinerário foi preservado.</p>
    </div>
  );
}
