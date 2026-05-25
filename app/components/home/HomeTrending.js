'use client';
import { useState, useEffect } from 'react';
import styles from './HomeTrending.module.css';

const seasonalData = {
  summer: [
    { name: 'Santorini, Grécia', img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac542?q=80&w=600&auto=format&fit=crop', score: 9.8, tags: ['Praia', 'Romance'] },
    { name: 'Algarve, Portugal', img: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?q=80&w=600&auto=format&fit=crop', score: 9.6, tags: ['Praia', 'Natureza'] },
    { name: 'Amalfi, Itália', img: 'https://images.unsplash.com/photo-1533604130095-88f5d0f19c96?q=80&w=600&auto=format&fit=crop', score: 9.9, tags: ['Cultura', 'Luxo'] },
    { name: 'Mykonos, Grécia', img: 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?q=80&w=600&auto=format&fit=crop', score: 9.5, tags: ['Festa', 'Praia'] },
    { name: 'Sardenha, Itália', img: 'https://images.unsplash.com/photo-1533726786632-15f1f9e2b1c4?q=80&w=600&auto=format&fit=crop', score: 9.7, tags: ['Relaxar', 'Mar'] },
    { name: 'Dubrovnik, Croácia', img: 'https://images.unsplash.com/photo-1558641913-9114382e70e9?q=80&w=600&auto=format&fit=crop', score: 9.4, tags: ['História', 'Vistas'] }
  ],
  winter: [
    { name: 'Zermatt, Suíça', img: 'https://images.unsplash.com/photo-1531366936336-62fc674cb3ce?q=80&w=600&auto=format&fit=crop', score: 9.9, tags: ['Neve', 'Aventura'] },
    { name: 'Chamonix, França', img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=600&auto=format&fit=crop', score: 9.7, tags: ['Ski', 'Montanha'] },
    { name: 'Tromso, Noruega', img: 'https://images.unsplash.com/photo-1517653664030-864bfdb0a59a?q=80&w=600&auto=format&fit=crop', score: 9.8, tags: ['Auroras', 'Natureza'] },
    { name: 'Reykjavik, Islândia', img: 'https://images.unsplash.com/photo-1518182170546-076616fd62df?q=80&w=600&auto=format&fit=crop', score: 9.6, tags: ['Geotermal', 'Frio'] },
    { name: 'Tenerife, Espanha', img: 'https://images.unsplash.com/photo-1554072675-924f71a067ff?q=80&w=600&auto=format&fit=crop', score: 9.5, tags: ['Inverno Quente', 'Sol'] },
    { name: 'Madeira, Portugal', img: 'https://images.unsplash.com/photo-1600257321689-d9fc30c333bb?q=80&w=600&auto=format&fit=crop', score: 9.8, tags: ['Natureza', 'Quente'] }
  ]
};

export default function HomeTrending({ onOpenWizard }) {
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    const month = new Date().getMonth(); // 0-11
    // Let's say winter in northern hemisphere is Nov(10), Dec(11), Jan(0), Feb(1), Mar(2)
    const isWinter = month >= 10 || month <= 2;
    setDestinations(isWinter ? seasonalData.winter : seasonalData.summer);
  }, []);

  return (
    <section className="section" style={{ backgroundColor: 'var(--bg-1)' }}>
      <div className="container">
        <div className="text-center animate-fade-in-up">
          <span className="section-label">Tendências</span>
          <h2 className="section-title">Em alta nesta estação</h2>
          <p className="section-subtitle mx-auto">
            Destinos perfeitamente curados para a época atual. Deixa a IA criar o teu roteiro.
          </p>
        </div>

        <div className={styles.grid}>
          {destinations.map((dest, i) => (
            <div key={i} className={`${styles.card} card-interactive`} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={styles.imgWrapper}>
                <img src={dest.img} alt={dest.name} width="600" height="800" loading="lazy" decoding="async" />
                <div className={styles.scoreBadge}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  {dest.score}
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.tags}>
                  {dest.tags.map(tag => <span key={tag} className={styles.tag}>{tag}</span>)}
                </div>
                <h3 className={styles.cardTitle}>{dest.name}</h3>
                <button 
                  className={`btn btn-secondary ${styles.exploreBtn}`} 
                  onClick={() => onOpenWizard && onOpenWizard(dest.name.split(',')[0], 1)}
                >
                  Explorar
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
