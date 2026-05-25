'use client';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './TripsList.module.css';

export default function TripsList() {
  const { user, updateUser } = useAuth();
  const trips = user?.trips || [];
  const [pendingDeleteTripId, setPendingDeleteTripId] = useState(null);

  const requestDeleteTrip = (tripId) => {
    setPendingDeleteTripId(tripId);
  };

  const confirmDeleteTrip = (tripId) => {
    const updated = trips.filter(t => t.id !== tripId);
    updateUser({ trips: updated });
    setPendingDeleteTripId(null);
  };

  if (trips.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>✈️</div>
        <h3>You haven't saved any trips yet</h3>
        <p>Go to the home page, generate an itinerary with AI and click "Save Itinerary"!</p>
        <a href="/#planner" className={styles.emptyBtn}>Generate Itinerary</a>
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
              <span className={styles.cardBadge}>{trip.days?.length || 0} days</span>
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
                      <span className={styles.moreStops}>+{day.stops.length - 3} more</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.cardFooter}>
              <span className={styles.cardDate}>
                Saved on {new Date(trip.savedAt).toLocaleDateString('en-US')}
              </span>
              {trip.totalCost && (
                <span className={styles.cardCost}>{trip.totalCost}</span>
              )}
              <button className={styles.deleteBtn} aria-label={`Delete ${trip.destination}`} onClick={() => requestDeleteTrip(trip.id)}>
                🗑️
              </button>
            </div>
            {pendingDeleteTripId === trip.id && (
              <div className={styles.inlineConfirm}>
                <span>Delete this saved trip?</span>
                <div>
                  <button type="button" onClick={() => setPendingDeleteTripId(null)}>Cancel</button>
                  <button type="button" onClick={() => confirmDeleteTrip(trip.id)}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
