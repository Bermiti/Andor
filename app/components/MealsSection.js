'use client';
import Image from 'next/image';
import styles from './MealsSection.module.css';
import { MapPin, Bookmark } from 'lucide-react';

export default function MealsSection({ meals, day }) {
  if (!meals || Object.keys(meals).length === 0) return null;

  const mealOrder = ['breakfast', 'lunch', 'dinner'];
  const mealLabels = {
    breakfast: '🥐 Pequeno-almoço',
    lunch: '🍽️ Almoço',
    dinner: '🍷 Jantar',
  };
  const mealPeriods = {
    breakfast: 'morning',
    lunch: 'afternoon',
    dinner: 'evening',
  };

  const availableMeals = mealOrder.filter((mealKey) => meals[mealKey]);

  return (
    <div className={styles.mealsSection}>
      <div className={styles.mealsHeader}>
        <h3 className={styles.mealsTitle}>Onde Comer</h3>
        <p className={styles.mealsSubtitle}>
          Recomendações selecionadas pelo Andor
        </p>
      </div>

      <div className={styles.mealsList}>
        {availableMeals.map((mealKey) => {
          const meal = meals[mealKey];
          const period = mealPeriods[mealKey];
          const periodColor =
            period === 'morning'
              ? '#F59E0B'
              : period === 'afternoon'
                ? '#3B82F6'
                : '#8B5CF6';

          return (
            <div key={mealKey} className={`${styles.mealCard} ${styles[`meal-${period}`]}`}>
              {/* Left: Icon and content */}
              <div className={styles.mealContent}>
                <div className={styles.mealLabel} style={{ borderColor: periodColor }}>
                  {mealLabels[mealKey]}
                </div>

                <h4 className={styles.restaurantName}>{meal.name}</h4>

                {meal.cuisine && (
                  <p className={styles.cuisine}>{meal.cuisine}</p>
                )}

                {meal.description && (
                  <p className={styles.description}>{meal.description}</p>
                )}

                <div className={styles.mealMeta}>
                  {meal.address && (
                    <span className={styles.metaItem}>
                      <MapPin size={12} />
                      {meal.address}
                    </span>
                  )}
                  {meal.cost && (
                    <span className={styles.metaItem}>
                      💰 €{meal.cost}
                    </span>
                  )}
                  {meal.rating && (
                    <span className={styles.metaItem}>
                      ⭐ {meal.rating}
                    </span>
                  )}
                  {meal.time && (
                    <span className={styles.metaItem}>
                      🕐 {meal.time}
                    </span>
                  )}
                </div>

                {meal.insiderTip && (
                  <div className={styles.insiderTip}>
                    💡 {meal.insiderTip}
                  </div>
                )}

                <div className={styles.mealActions}>
                  {meal.bookingUrl && (
                    <a
                      href={meal.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.actionBtn}
                    >
                      Reservar
                    </a>
                  )}
                  <button className={styles.actionBtn}>
                    <Bookmark size={12} />
                    Guardar
                  </button>
                </div>
              </div>

              {/* Right: Photo */}
              {meal.photo && (
                <div className={styles.mealPhoto}>
                  <Image
                    src={meal.photo}
                    alt={meal.name}
                    width={160}
                    height={120}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 8,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
