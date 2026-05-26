'use client';
import styles from './HomeTrending.module.css';

const monthlyDestinations = {
  4: [
    {
      name: 'Kyoto',
      country: 'Japão',
      img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=900&auto=format&fit=crop',
      score: 94,
      price: '€1.260',
      badge: 'Glicínias + sakura tardia',
      tags: ['Cultura', 'Primavera'],
    },
    {
      name: 'Lisbon',
      country: 'Portugal',
      img: 'https://images.unsplash.com/photo-1509840841025-9088ba78a826?q=80&w=900&auto=format&fit=crop',
      score: 92,
      price: '€420',
      badge: 'Clima perfeito antes do calor',
      tags: ['Sol', 'Gastronomia'],
    },
    {
      name: 'Iceland',
      country: 'Islândia',
      img: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?q=80&w=900&auto=format&fit=crop',
      score: 88,
      price: '€780',
      badge: 'Começo do sol da meia-noite',
      tags: ['Natureza', 'Luz'],
    },
    {
      name: 'Prague',
      country: 'Chéquia',
      img: 'https://images.unsplash.com/photo-1541849546-216549ae216d?q=80&w=900&auto=format&fit=crop',
      score: 91,
      price: '€520',
      badge: 'Pico da primavera',
      tags: ['História', 'Walks'],
    },
    {
      name: 'Azores',
      country: 'Portugal',
      img: 'https://images.unsplash.com/photo-1582885938164-1af58ee6effa?q=80&w=900&auto=format&fit=crop',
      score: 95,
      price: '€390',
      badge: 'Flores + baleias',
      tags: ['Natureza', 'Oceano'],
    },
    {
      name: 'Copenhagen',
      country: 'Dinamarca',
      img: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?q=80&w=900&auto=format&fit=crop',
      score: 89,
      price: '€610',
      badge: 'Noites longas e cultura outdoor',
      tags: ['Design', 'Cidade'],
    },
  ],
};

const fallbackDestinations = [
  {
    name: 'Tokyo',
    country: 'Japão',
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=900&auto=format&fit=crop',
    score: 93,
    price: '€980',
    badge: 'Escolha forte todo o ano',
    tags: ['Cultura', 'Food'],
  },
];

export default function HomeTrending({ onOpenWizard }) {
  const month = new Date().getMonth();
  const destinations = monthlyDestinations[month] || fallbackDestinations;

  return (
    <section className="section" style={{ backgroundColor: 'var(--bg-1)' }}>
      <div className="container">
        <div className="text-center animate-fade-in-up">
          <span className="section-label">Tendências</span>
          <h2 className="section-title">Em alta nesta estação</h2>
          <p className="section-subtitle mx-auto">
            Destinos escolhidos para o mês atual, com clima, preço e ritmo turístico em equilíbrio.
          </p>
        </div>

        <div className={styles.grid}>
          {destinations.map((dest, i) => (
            <article key={`${dest.name}-${dest.country}`} className={`${styles.card} card-interactive`} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={styles.imgWrapper}>
                <img src={dest.img} alt={`${dest.name}, ${dest.country}`} width="600" height="800" loading="lazy" decoding="async" />
                <div className={styles.scoreBadge} aria-label={`Andor Score ${dest.score} de 100`}>
                  <span>{dest.score}</span>
                  <small>/100</small>
                </div>
                <div className={styles.seasonBadge}>{dest.badge}</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.tags}>
                  {dest.tags.map(tag => <span key={tag} className={styles.tag}>{tag}</span>)}
                </div>
                <h3 className={styles.cardTitle}>{dest.name}</h3>
                <p className={styles.cardMeta}>{dest.country} · A partir de {dest.price}</p>
                <button
                  className={`btn btn-secondary ${styles.exploreBtn}`}
                  onClick={() => onOpenWizard && onOpenWizard(dest.name, 2)}
                >
                  <span>Explorar</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
