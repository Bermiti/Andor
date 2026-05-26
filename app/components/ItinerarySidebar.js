'use client';
import styles from './ItinerarySidebar.module.css';
import { Bookmark, Download, Share2, AlertCircle } from 'lucide-react';

export default function ItinerarySidebar({
  itinerary,
  totalBudget,
  onExportPDF,
  onShare,
  onSave,
  isSaved,
}) {
  if (!itinerary) return null;

  const totalDays = itinerary.days?.length || 0;
  const totalFlights = itinerary.flights?.length || 0;
  const totalStops = itinerary.days?.reduce((sum, day) => sum + (day.stops?.length || 0), 0) || 0;
  const totalMeals = itinerary.days?.filter(day => day.meals).length || 0;

  return (
    <aside className={styles.sidebar}>
      {/* Trip Summary Card */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <h3 className={styles.summaryTitle}>Trip Summary</h3>
          <button
            className={`${styles.favBtn} ${isSaved ? styles.saved : ''}`}
            onClick={() => onSave?.()}
            aria-label={isSaved ? 'Remover dos guardados' : 'Guardar viagem'}
          >
            <Bookmark
              size={16}
              fill={isSaved ? 'currentColor' : 'none'}
              style={{ stroke: 'currentColor' }}
            />
          </button>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Dias</span>
            <span className={styles.statValue}>{totalDays}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Atividades</span>
            <span className={styles.statValue}>{totalStops}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Refeições</span>
            <span className={styles.statValue}>{totalMeals}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Voos</span>
            <span className={styles.statValue}>{totalFlights}</span>
          </div>
        </div>

        <div className={styles.budgetBox}>
          <span className={styles.budgetLabel}>Orçamento Total Estimado</span>
          <span className={styles.budgetValue}>€{totalBudget || '0'}</span>
          <span className={styles.budgetSmall}>
            (~€{totalBudget && totalDays ? (totalBudget / totalDays).toFixed(0) : '0'} por dia)
          </span>
        </div>
      </div>

      {/* Flights Breakdown */}
      {itinerary.flights && itinerary.flights.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>✈️ Voos</h4>
          <div className={styles.flightsList}>
            {itinerary.flights.map((flight, i) => (
              <div key={i} className={styles.flightItem}>
                <div className={styles.flightRoute}>
                  <span className={styles.airport}>{flight.from}</span>
                  <span className={styles.arrow}>→</span>
                  <span className={styles.airport}>{flight.to}</span>
                </div>
                <div className={styles.flightDate}>
                  {flight.date && new Date(flight.date).toLocaleDateString('pt-PT', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                {flight.airline && (
                  <div className={styles.flightAirline}>{flight.airline}</div>
                )}
                {flight.cost && (
                  <div className={styles.flightCost}>€{flight.cost}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accommodation */}
      {itinerary.accommodation && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>🏨 Alojamento</h4>
          {itinerary.accommodation.map((acc, i) => (
            <div key={i} className={styles.accommodationItem}>
              <div className={styles.accName}>{acc.name}</div>
              <div className={styles.accDate}>
                {acc.checkInDate && new Date(acc.checkInDate).toLocaleDateString('pt-PT')}
                {' - '}
                {acc.checkOutDate && new Date(acc.checkOutDate).toLocaleDateString('pt-PT')}
              </div>
              {acc.cost && <div className={styles.accCost}>€{acc.cost}/noite</div>}
            </div>
          ))}
        </div>
      )}

      {/* Alerts/Notes */}
      {itinerary.importantNotes && (
        <div className={styles.alertsSection}>
          <div className={styles.alertTitle}>
            <AlertCircle size={14} />
            Notas Importantes
          </div>
          <ul className={styles.alertsList}>
            {itinerary.importantNotes.map((note, i) => (
              <li key={i} className={styles.alertItem}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${styles.primary}`}
          onClick={() => onExportPDF?.()}
        >
          <Download size={14} />
          Exportar PDF
        </button>
        <button className={styles.actionBtn} onClick={() => onShare?.()}>
          <Share2 size={14} />
          Partilhar
        </button>
      </div>

      {/* Booking Links */}
      <div className={styles.bookingHints}>
        <p className={styles.hintText}>
          Pronto para reservar? Links rápidos:
        </p>
        <a href="https://booking.com" target="_blank" rel="noopener noreferrer" className={styles.linkBtn}>
          Booking.com
        </a>
        <a href="https://www.airbnb.com" target="_blank" rel="noopener noreferrer" className={styles.linkBtn}>
          Airbnb
        </a>
        <a href="https://www.kayak.com" target="_blank" rel="noopener noreferrer" className={styles.linkBtn}>
          Kayak (Voos)
        </a>
      </div>
    </aside>
  );
}
