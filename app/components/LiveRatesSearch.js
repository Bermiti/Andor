'use client';

import { useState } from 'react';
import { Plane, Hotel, Loader2, CheckCircle2, Ticket } from 'lucide-react';
import styles from './LiveRatesSearch.module.css';

export default function LiveRatesSearch({ destination, tripDays, passengers = 2, onSelectFlight, onSelectHotel, selectedFlight, selectedHotel }) {
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [searched, setSearched] = useState(false);

  const searchRates = async () => {
    setSearched(true);
    setLoadingFlights(true);
    setLoadingHotels(true);

    try {
      const flightRes = await fetch('/api/enrich/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, passengers }),
      });
      if (flightRes.ok) {
        const payload = await flightRes.json();
        setFlights(payload.offers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFlights(false);
    }

    try {
      const hotelRes = await fetch('/api/enrich/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, guests: passengers, checkIn: new Date().toISOString().slice(0, 10) }),
      });
      if (hotelRes.ok) {
        const payload = await hotelRes.json();
        setHotels(payload.hotels || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHotels(false);
    }
  };

  const formatPrice = (cents) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Reservas Andor</span>
          <h2>Pesquisar Tarifas ao Vivo</h2>
          <p>Encontra voos e alojamentos em tempo real de fornecedores parceiros da agência.</p>
        </div>
        {!searched && (
          <button className={styles.searchBtn} onClick={searchRates}>
            Verificar Tarifas Atuais
          </button>
        )}
      </div>

      {searched && (
        <div className={styles.resultsGrid}>
          {/* FLIGHTS COLUMN */}
          <div className={styles.column}>
            <div className={styles.colHeader}>
              <Plane size={18} />
              <h3>Voos Disponíveis ({passengers} {passengers === 1 ? 'passageiro' : 'passageiros'})</h3>
            </div>

            {loadingFlights ? (
              <div className={styles.loading}>
                <Loader2 className={styles.spinner} size={24} />
                <span>A consultar tarifas GDS...</span>
              </div>
            ) : flights.length === 0 ? (
              <p className={styles.empty}>Nenhum voo encontrado para as datas selecionadas.</p>
            ) : (
              <div className={styles.list}>
                {flights.map((flight) => {
                  const isSelected = selectedFlight?.id === flight.id;
                  return (
                    <div
                      key={flight.id}
                      className={`${styles.card} ${isSelected ? styles.cardActive : ''}`}
                      onClick={() => onSelectFlight(isSelected ? null : flight)}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.airline}>
                          <span className={styles.logo}>{flight.logo}</span>
                          <strong>{flight.airline}</strong>
                          <span className={styles.flightNo}>{flight.flightNumber}</span>
                        </div>
                        {isSelected && <CheckCircle2 size={16} className={styles.checkIcon} />}
                      </div>
                      <div className={styles.timings}>
                        <div>
                          <strong>{flight.departureTime}</strong>
                          <span>LIS</span>
                        </div>
                        <div className={styles.durationLine}>
                          <span>{flight.duration}</span>
                          <div className={styles.line} />
                          <span>{flight.stops === 0 ? 'Direto' : `${flight.stops} escala`}</span>
                        </div>
                        <div>
                          <strong>{flight.arrivalTime}</strong>
                          <span>{destination.slice(0, 3).toUpperCase()}</span>
                        </div>
                      </div>
                      <div className={styles.priceRow}>
                        <span>{flight.cabinClass} · {flight.seatsAvailable} lugares restam</span>
                        <strong>{formatPrice(flight.priceCents)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* HOTELS COLUMN */}
          <div className={styles.column}>
            <div className={styles.colHeader}>
              <Hotel size={18} />
              <h3>Hotéis ({tripDays} noites, {passengers} hóspedes)</h3>
            </div>

            {loadingHotels ? (
              <div className={styles.loading}>
                <Loader2 className={styles.spinner} size={24} />
                <span>A consultar inventário de quartos...</span>
              </div>
            ) : hotels.length === 0 ? (
              <p className={styles.empty}>Nenhum hotel disponível para esta localização.</p>
            ) : (
              <div className={styles.list}>
                {hotels.map((hotel) => {
                  const isSelected = selectedHotel?.id === hotel.id;
                  return (
                    <div
                      key={hotel.id}
                      className={`${styles.card} ${isSelected ? styles.cardActive : ''}`}
                      onClick={() => onSelectHotel(isSelected ? null : hotel)}
                    >
                      <div className={styles.hotelImageRow}>
                        <img src={hotel.photo} alt={hotel.name} className={styles.hotelThumb} />
                        <div className={styles.hotelInfo}>
                          <strong>{hotel.name}</strong>
                          <div className={styles.hotelRating}>
                            <span>⭐ {hotel.rating}</span>
                            <span>({hotel.stars} estrelas)</span>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={16} className={styles.checkIconAbsolute} />}
                      </div>
                      <div className={styles.hotelRoomType}>
                        <span>Quarto:</span> <strong>{hotel.roomType}</strong>
                      </div>
                      <div className={styles.amenities}>
                        {hotel.amenities.map((item) => (
                          <span key={item} className={styles.amenityBadge}>{item}</span>
                        ))}
                      </div>
                      <div className={styles.priceRow}>
                        <span>Tarifa por noite: {formatPrice(hotel.ratePerNightCents)}</span>
                        <strong>{formatPrice(hotel.totalPriceCents)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
