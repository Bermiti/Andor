'use client';

import { useEffect, useMemo, useState } from 'react';
import { Car, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';
import { getJson, setJson } from '../lib/storage';
import { updateSavedTrip } from '../lib/itinerary-store';
import styles from './RentalCarSection.module.css';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Nao iniciado' },
  { value: 'searching', label: 'A pesquisar' },
  { value: 'selected', label: 'Selecionado' },
  { value: 'booked', label: 'Reservado' },
  { value: 'confirmed', label: 'Confirmado' },
];

function normalizeRentalCar(rentalCar = {}, destination = '') {
  const recommended = rentalCar.recommended === true
    ? 'yes'
    : rentalCar.recommended === false
      ? 'no'
      : rentalCar.recommendation || 'maybe';

  return {
    recommended,
    strategy: rentalCar.strategy || rentalCar.reason || `Use rent-a-car only when it clearly improves regional days around ${destination || 'the destination'}.`,
    pickup: rentalCar.pickup || rentalCar.pickupLocation || 'Airport pickup if driving immediately; city pickup after car-free city days.',
    dropoff: rentalCar.dropoff || rentalCar.dropoffLocation || rentalCar.pickup || 'Return where it avoids city-center parking and last-day stress.',
    estimatedCost: rentalCar.estimatedCost || rentalCar.priceRange || 'Check live rates',
    insuranceNote: rentalCar.insuranceNote || 'Verify excess, deposit, mileage, and card requirements before booking.',
    parkingNote: rentalCar.parkingNote || 'Check hotel parking, tolls, low-emission zones, and old-town restrictions.',
    usefulFor: Array.isArray(rentalCar.usefulFor) ? rentalCar.usefulFor : [],
    searchLinks: rentalCar.searchLinks || {},
    bookingStatus: rentalCar.bookingStatus || 'not_started',
    reference: rentalCar.reference || rentalCar.confirmationNumber || '',
    price: rentalCar.price || rentalCar.selectedPrice || '',
    notes: rentalCar.notes || '',
  };
}

function getRecommendationCopy(value) {
  if (value === 'yes') return { label: 'Recomendado', tone: 'yes' };
  if (value === 'no') return { label: 'Nao recomendado', tone: 'no' };
  return { label: 'Talvez', tone: 'maybe' };
}

export default function RentalCarSection({ rentalCar, destination, storageKey, tripId }) {
  const normalized = useMemo(() => normalizeRentalCar(rentalCar, destination), [rentalCar, destination]);
  const recommendation = getRecommendationCopy(normalized.recommended);
  const [state, setState] = useState({});

  useEffect(() => {
    if (!storageKey) return;
    setState(getJson(storageKey, {}, 'local') || {});
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    setJson(storageKey, state, 'local');
  }, [state, storageKey]);

  if (!rentalCar) {
    return (
      <div className={styles.empty}>
        <Car size={22} aria-hidden="true" />
        <p>Analise de rent-a-car a carregar...</p>
      </div>
    );
  }

  const getValue = (field) => state[field] ?? normalized[field] ?? '';
  const update = (field, value) => {
    setState((prev) => {
      const nextState = { ...prev, [field]: value };
      
      if (tripId) {
        updateSavedTrip(tripId, (trip) => {
          if (!trip.rentalCar) trip.rentalCar = {};
          trip.rentalCar = { ...trip.rentalCar, ...nextState };
          return trip;
        });
      }
      
      return nextState;
    });
  };
  const links = Object.entries(normalized.searchLinks).filter(([, url]) => Boolean(url));

  return (
    <section className={styles.section} aria-label="Rent-a-car booking ready">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            <Car size={22} aria-hidden="true" />
            Rent-a-car
          </h2>
          <p className={styles.subtitle}>Recomendacao logistica, nao uma reserva automatica.</p>
        </div>
        <span className={`${styles.badge} ${styles[recommendation.tone]}`}>
          {recommendation.label}
        </span>
      </div>

      <p className={styles.strategy}>{normalized.strategy}</p>

      <div className={styles.metaGrid}>
        <div>
          <span>Pickup</span>
          <strong>{normalized.pickup}</strong>
        </div>
        <div>
          <span>Dropoff</span>
          <strong>{normalized.dropoff}</strong>
        </div>
        <div>
          <span>Custo</span>
          <strong>{normalized.estimatedCost}</strong>
        </div>
      </div>

      {normalized.usefulFor.length > 0 && (
        <div className={styles.usefulFor}>
          {normalized.usefulFor.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      )}

      <div className={styles.notes}>
        <div>
          <ShieldCheck size={15} aria-hidden="true" />
          <span>{normalized.insuranceNote}</span>
        </div>
        <div>
          <CheckCircle2 size={15} aria-hidden="true" />
          <span>{normalized.parkingNote}</span>
        </div>
      </div>

      <div className={styles.bookingFields}>
        <label>
          <span>Estado</span>
          <select value={getValue('bookingStatus')} onChange={(event) => update('bookingStatus', event.target.value)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Referencia</span>
          <input value={getValue('reference')} onChange={(event) => update('reference', event.target.value)} placeholder="Voucher ou reserva" />
        </label>
        <label>
          <span>Preco</span>
          <input value={getValue('price')} onChange={(event) => update('price', event.target.value)} placeholder="Ex: EUR 260" />
        </label>
        <label className={styles.fullField}>
          <span>Notas</span>
          <input value={getValue('notes')} onChange={(event) => update('notes', event.target.value)} placeholder="Seguro, deposito, cadeiras, quilometragem" />
        </label>
      </div>

      {links.length > 0 && (
        <div className={styles.links}>
          {links.map(([label, url]) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer">
              {label} <ExternalLink size={12} aria-hidden="true" />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
