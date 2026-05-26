'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './DestinosAlta.module.css';

const SEASONAL_DESTINATIONS_MAP = {
  winter: [
    { city: 'Maldivas', country: 'Maldives', flag: '🇲🇻', badge: '☀️ Sol de Inverno', score: 94, price: 1450, img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=75&auto=format&fit=crop' },
    { city: 'Bangkok', country: 'Tailândia', flag: '🇹🇭', badge: '🔥 Alta temporada', score: 92, price: 680, img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=75&auto=format&fit=crop' },
    { city: 'Dubai', country: 'EAU', flag: '🇦🇪', badge: '☀️ Clima perfeito', score: 90, price: 820, img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=75&auto=format&fit=crop' },
    { city: 'Tenerife', country: 'Canárias', flag: '🇪🇸', badge: '🏝️ Escapadela relax', score: 84, price: 290, img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=75&auto=format&fit=crop' }
  ],
  spring: [
    { city: 'Tokyo', country: 'Japão', flag: '🇯🇵', badge: '🌸 Cerejeiras em flor', score: 98, price: 1200, img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=75&auto=format&fit=crop' },
    { city: 'Lisboa', country: 'Portugal', flag: '🇵🇹', badge: '🌸 Primavera atlântica', score: 91, price: 300, img: 'https://images.unsplash.com/photo-1509840841025-9088ba78a826?w=800&q=75&auto=format&fit=crop' },
    { city: 'Roma', country: 'Itália', flag: '🇮🇹', badge: '🏛️ Florescer romano', score: 93, price: 390, img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=75&auto=format&fit=crop' },
    { city: 'Praga', country: 'República Checa', flag: '🇨🇿', badge: '🏰 Primavera mágica', score: 89, price: 250, img: 'https://images.unsplash.com/photo-1541343072874-3ee362860cce?w=800&q=75&auto=format&fit=crop' }
  ],
  summer: [
    { city: 'Santorini', country: 'Grécia', flag: '🇬🇷', badge: '☀️ Sol e praia', score: 95, price: 950, img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=75&auto=format&fit=crop' },
    { city: 'Dubrovnik', country: 'Croácia', flag: '🇭🇷', badge: '☀️ Alta temporada', score: 91, price: 680, img: 'https://images.unsplash.com/photo-1555992336-03a23c7b20eb?w=800&q=75&auto=format&fit=crop' },
    { city: 'Algarve', country: 'Portugal', flag: '🇵🇹', badge: '🏖️ Verão dourado', score: 92, price: 400, img: 'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=800&q=75&auto=format&fit=crop' },
    { city: 'Reykjavik', country: 'Islândia', flag: '🇮🇸', badge: '🏔️ Sol da meia-noite', score: 90, price: 850, img: 'https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=800&q=75&auto=format&fit=crop' }
  ],
  autumn: [
    { city: 'Marraquexe', country: 'Marrocos', flag: '🇲🇦', badge: '🍁 Clima ameno', score: 93, price: 450, img: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=800&q=75&auto=format&fit=crop' },
    { city: 'Seul', country: 'Coreia do Sul', flag: '🇰🇷', badge: '🍁 Outono dourado', score: 92, price: 990, img: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=75&auto=format&fit=crop' },
    { city: 'Nova Iorque', country: 'EUA', flag: '🇺🇸', badge: '🌆 Central Park dourado', score: 94, price: 1150, img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=75&auto=format&fit=crop' }
  ]
};

export default function DestinosAlta({ onOpenWizard }) {
  const [currentMonthName, setCurrentMonthName] = useState('');
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthIndex = new Date().getMonth();
    setCurrentMonthName(months[monthIndex]);

    // Determine seasonal key
    let key = 'autumn';
    if (monthIndex === 11 || monthIndex === 0 || monthIndex === 1) key = 'winter';
    else if (monthIndex === 2 || monthIndex === 3 || monthIndex === 4) key = 'spring';
    else if (monthIndex === 5 || monthIndex === 6 || monthIndex === 7) key = 'summer';

    setDestinations(SEASONAL_DESTINATIONS_MAP[key] || SEASONAL_DESTINATIONS_MAP.autumn);
  }, []);

  const handleSelectCard = (dest) => {
    if (onOpenWizard) {
      onOpenWizard(`${dest.city}, ${dest.country}`, 2);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#10B981'; // Green
    if (score >= 70) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  return (
    <section className={styles.section} id="destinos">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.label}>Explora o mundo</span>
          <h2 className={styles.title}>Destinos recomendados para {currentMonthName}</h2>
          <p className={styles.subtitle}>
            As melhores escolhas de viagem baseadas nas condições climatéricas e eventos locais.
          </p>
        </div>

        <div className={styles.scrollWrapper}>
          <div className={styles.grid}>
            {destinations.map((dest, i) => (
              <div key={i} className={styles.card} onClick={() => handleSelectCard(dest)}>
                <div className={styles.imgWrapper}>
                  <Image 
                    src={dest.img} 
                    alt={`${dest.city}, ${dest.country}`} 
                    width={300}
                    height={400}
                    loading="lazy"
                    sizes="(max-width: 640px) 100vw, 300px"
                  />
                  <div className={styles.bottomOverlay}></div>
                  <div className={styles.badge}>{dest.badge}</div>
                  
                  {/* Hover visual Explore button */}
                  <div className={styles.cardHoverOverlay}>
                    <button 
                      type="button" 
                      className={styles.exploreBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCard(dest);
                      }}
                    >
                      Explorar →
                    </button>
                  </div>
                </div>

                <div className={styles.cardDetails}>
                  <div className={styles.location}>
                    <h3 className={styles.city}>
                      <span style={{ marginRight: '6px' }}>{dest.flag}</span>
                      {dest.city}
                    </h3>
                    <span className={styles.country}>{dest.country}</span>
                  </div>

                  <div className={styles.metrics}>
                    <div className={styles.scoreWrap}>
                      <span className={styles.scoreLabel}>Andor Score</span>
                      <span className={styles.scoreValue} style={{ color: getScoreColor(dest.score) }}>
                        {dest.score}/100
                      </span>
                    </div>
                    
                    <div className={styles.priceWrap}>
                      <span className={styles.priceLabel}>Orçamento base</span>
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
