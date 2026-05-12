'use client';
import { useAuth } from '../../context/AuthContext';
import styles from './TripsList.module.css';

export default function TripsList() {
  const { user, updateUser } = useAuth();
  const trips = user?.trips || [];

  const deleteTrip = (tripId) => {
    if (!confirm('Tens a certeza que queres apagar esta viagem?')) return;
    const updated = trips.filter(t => t.id !== tripId);
    updateUser({ trips: updated });
  };

  if (trips.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>✈️</div>
        <h3>Ainda não guardaste nenhuma viagem</h3>
        <p>Vai à página principal, gera um itinerário com a IA e clica em "Save Itinerary"!</p>
        <a href="/#planner" className={styles.emptyBtn}>Gerar Itinerário</a>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {trips.map(trip => (
          <div key={trip.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>📍 {trip.destination}</h3>
              <span className={styles.cardBadge}>{trip.days?.length || 0} dias</span>
            </div>

            <div className={styles.cardStops}>
              {trip.days?.map((day, di) => (
                <div key={di} className={styles.dayBlock}>
                  <div className={styles.dayLabel}>{day.title}</div>
                  <div className={styles.stopsList}>
                    {day.stops?.slice(0, 3).map((stop, si) => (
                      <div key={si} className={styles.stop}>
                        <span className={styles.stopTime}>{stop.time}</span>
                        <span className={styles.stopName}>{stop.name}</span>
                      </div>
                    ))}
                    {day.stops?.length > 3 && (
                      <span className={styles.moreStops}>+{day.stops.length - 3} mais</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.cardFooter}>
              <span className={styles.cardDate}>
                Guardado em {new Date(trip.savedAt).toLocaleDateString('pt-PT')}
              </span>
              {trip.totalCost && (
                <span className={styles.cardCost}>{trip.totalCost}</span>
              )}
              <button className={styles.deleteBtn} onClick={() => deleteTrip(trip.id)}>
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
