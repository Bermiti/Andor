'use client';
import { useState, useEffect } from 'react';
import { safeParse } from '../lib/safe-json';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/ToastProvider';
import { itineraries } from '../components/Social';
import styles from './page.module.css';

export default function MyFavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [pendingRemoveSlug, setPendingRemoveSlug] = useState(null);
  const { success } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('andor_favorites');
      if (stored) {
        try {
          setFavorites(safeParse(stored, []));
        } catch (e) {
          // silent fail
        }
      }
      setLoaded(true);
    }
  }, []);

  const handleRemoveFavorite = (slug) => {
    const nextFavorites = favorites.filter(f => f !== slug);
    setFavorites(nextFavorites);
    localStorage.setItem('andor_favorites', JSON.stringify(nextFavorites));
    setPendingRemoveSlug(null);
    success('Favorito removido.');
  };

  const favoritedItineraries = itineraries.filter(item => favorites.includes(item.slug));

  return (
    <>
      <Navbar />
      <main className={styles.container}>
        <div className={styles.header}>
          <span className={styles.badge}>❤️ Os Meus Favoritos</span>
          <h1 className={styles.title}>Os Teus Destinos de Sonho</h1>
          <p className={styles.subtitle}>
            Gere e explora os teus itinerários premium guardados.
          </p>
        </div>

        {loaded && favoritedItineraries.length > 0 ? (
          <div className={styles.grid}>
            {favoritedItineraries.map((item) => (
              <div key={item.slug} className={styles.card}>
                <Link href={`/itinerary/${item.slug}`} className={styles.cardLink}>
                  <div className={styles.cardImage}>
                    <div 
                      className={styles.cardBg} 
                      style={{ backgroundImage: `url(${item.image})` }}
                    ></div>
                    <div className={styles.cardOverlay}></div>
                    <span className={styles.cardBadge}>{item.badge}</span>
                    
                    {item.price !== 'Free' && (
                      <div className={styles.cardPriceContainer}>
                        <span className={styles.cardPrice}>{item.price}</span>
                        {item.oldPrice && <span className={styles.cardPriceOld}>{item.oldPrice}</span>}
                        {item.discount && <span className={styles.cardDiscountBadge}>{item.discount}</span>}
                      </div>
                    )}
                    {item.price === 'Free' && <span className={`${styles.cardPrice} ${styles.cardPriceFree}`}>Free</span>}
                    
                    <button
                      type="button"
                      className={styles.favoriteButton}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPendingRemoveSlug(item.slug);
                      }}
                      aria-label={`Remover ${item.title} dos favoritos`}
                    >
                      <svg className={styles.heartSvg} viewBox="0 0 24 24" width="18" height="18">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </button>
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <p className={styles.cardDesc}>{item.desc}</p>
                    <div className={styles.cardMeta}>
                      <div className={styles.cardAuthor}>
                        <div className={styles.cardAuthorAvatar}>{item.author}</div>
                        <span className={styles.cardAuthorName}>{item.authorName} • {item.days}</span>
                      </div>
                      <div className={styles.cardStats}>
                        <span className={styles.cardStat}>❤️ {item.likes}</span>
                        <span className={styles.cardStat}>📌 {item.saves}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : loaded ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>❤️</div>
            <h3 className={styles.emptyTitle}>Ainda não tens favoritos</h3>
            <p className={styles.emptyDesc}>
              Navega pela nossa coleção de viagens e clica no ícone de coração para as guardar aqui.
            </p>
            <Link href="/#community" className={styles.exploreBtn}>
              Explorar Itinerários
            </Link>
          </div>
        ) : (
          <div className={styles.loading}>Carregando os teus favoritos...</div>
        )}
        <ConfirmDialog
          isOpen={Boolean(pendingRemoveSlug)}
          title="Remover favorito?"
          description="Este destino sai da tua lista de favoritos. Podes guardá-lo novamente mais tarde."
          confirmLabel="Remover"
          destructive
          onCancel={() => setPendingRemoveSlug(null)}
          onConfirm={() => handleRemoveFavorite(pendingRemoveSlug)}
        />
      </main>
    </>
  );
}
