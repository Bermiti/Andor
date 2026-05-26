'use client';

import { useEffect, useState } from 'react';
import { getJson, setJson } from '../lib/storage';
import styles from './FavoriteButton.module.css';

export default function FavoriteButton({
  itemId,
  itemType = 'activity',
  label,
  activeLabel,
  className = '',
  onToggle,
  initialActive = false,
}) {
  const [favorited, setFavorited] = useState(initialActive);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    setFavorited(initialActive);
  }, [initialActive]);

  const handleFavorite = (event) => {
    event.stopPropagation();
    const next = !favorited;
    if (next) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    }

    const key = `andor_favorite_ids_${itemType}`;
    const existing = getJson(key, [], 'local') || [];
    const updated = next
      ? Array.from(new Set([...existing, itemId]))
      : existing.filter((id) => id !== itemId);
    setJson(key, updated, 'local');
    setFavorited(next);
    onToggle?.(next, event);
  };

  return (
    <button
      type="button"
      className={`${styles.favoriteButton} ${favorited ? styles.filled : ''} ${burst ? styles.burst : ''} ${className}`}
      onClick={handleFavorite}
      aria-pressed={favorited}
      aria-label={favorited ? activeLabel || 'Remover dos favoritos' : label || 'Guardar nos favoritos'}
    >
      <span className={styles.heartWrap} aria-hidden="true">
        <svg className={styles.heart} viewBox="0 0 24 24" width="18" height="18">
          <path d="M20.8 4.6c-1.9-1.8-4.9-1.7-6.7.2L12 7l-2.1-2.2C8.1 2.9 5.1 2.8 3.2 4.6c-2 1.9-2.1 5.1-.2 7.1l8.1 8.4c.5.5 1.3.5 1.8 0l8.1-8.4c1.9-2 1.8-5.2-.2-7.1Z" />
        </svg>
        {burst && (
          <span className={styles.particles}>
            {[0, 1, 2, 3, 4, 5].map((dot) => (
              <span key={dot} className={styles[`p${dot + 1}`]} />
            ))}
          </span>
        )}
      </span>
      <span>{favorited ? activeLabel || 'Guardado' : label || 'Guardar'}</span>
    </button>
  );
}
