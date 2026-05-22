'use client';
import { useState, useEffect } from 'react';
import styles from './DestinosAlta.module.css';

const TRENDING_DESTINATIONS = [
  {
    city: 'Tóquio',
    country: 'Japão',
    badge: '🔥 Trending',
    score: 96,
    price: 1200,
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600',
    lat: 35.6762,
    lng: 139.6503
  },
  {
    city: 'Santorini',
    country: 'Grécia',
    badge: '💎 Premium',
    score: 94,
    price: 850,
    img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600',
    lat: 36.3932,
    lng: 25.4615
  },
  {
    city: 'Paris',
    country: 'França',
    badge: '✨ Novo',
    score: 92,
    price: 450,
    img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600',
    lat: 48.8566,
    lng: 2.3522
  },
  {
    city: 'Bali',
    country: 'Indonésia',
    badge: '🔥 Trending',
    score: 95,
    price: 980,
    img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600',
    lat: -8.4095,
    lng: 115.1889
  },
  {
    city: 'Lisboa',
    country: 'Portugal',
    badge: '💎 Premium',
    score: 91,
    price: 300,
    img: 'https://images.unsplash.com/photo-1509840841025-9088ba78a826?w=600',
    lat: 38.7223,
    lng: -9.1393
  },
  {
    city: 'Nova Iorque',
    country: 'EUA',
    badge: '🔥 Trending',
    score: 93,
    price: 1100,
    img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600',
    lat: 40.7128,
    lng: -74.0060
  }
];

export default function DestinosAlta() {
  const [currentMonthName, setCurrentMonthName] = useState('');

  useEffect(() => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthIndex = new Date().getMonth();
    setCurrentMonthName(months[monthIndex]);
  }, []);

  const handleExploreDest = (dest) => {
    // Open AI drawer and query destination
    const event = new CustomEvent('andor-search-trigger', {
      detail: {
        destination: `${dest.city}, ${dest.country}`,
        dateArrival: '',
        dateDeparture: '',
        adults: 2,
        children: 0
      }
    });
    window.dispatchEvent(event);
  };

  return (
    <section className={styles.section} id="destinos">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.label}>Explora o mundo</span>
          <h2 className={styles.title}>Destinos que o mundo está a descobrir</h2>
          <p className={styles.subtitle}>
            As melhores escolhas de viagem em tempo real para <strong>{currentMonthName}</strong>.
          </p>
        </div>

        <div className={styles.scrollWrapper}>
          <div className={styles.grid}>
            {TRENDING_DESTINATIONS.map((dest, i) => (
              <div key={i} className={styles.card}>
                <div className={styles.imgWrapper}>
                  <img src={dest.img} alt={`${dest.city}, ${dest.country}`} loading="lazy" />
                  <div className={styles.badge}>{dest.badge}</div>
                  
                  {/* Hover visual Explore button */}
                  <div className={styles.cardHoverOverlay}>
                    <button 
                      type="button" 
                      className={styles.exploreBtn}
                      onClick={() => handleExploreDest(dest)}
                    >
                      Explorar Com Andor ✦
                    </button>
                  </div>
                </div>

                <div className={styles.cardDetails}>
                  <div className={styles.location}>
                    <h3 className={styles.city}>{dest.city}</h3>
                    <span className={styles.country}>{dest.country}</span>
                  </div>

                  <div className={styles.metrics}>
                    <div className={styles.scoreWrap}>
                      <span className={styles.scoreLabel}>Andor Score</span>
                      <span className={styles.scoreValue}>{dest.score}/100</span>
                    </div>
                    
                    <div className={styles.priceWrap}>
                      <span className={styles.priceLabel}>Preço médio</span>
                      <span className={styles.priceValue}>a partir de €{dest.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
