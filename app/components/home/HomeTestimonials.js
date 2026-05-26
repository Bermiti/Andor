'use client';
import styles from './HomeTestimonials.module.css';

const testimonials = [
  {
    name: 'João & Sofia',
    avatarColor: '#E8604A',
    initials: 'JS',
    city: 'Porto',
    date: 'Março 2025',
    quote: 'A nossa lua de mel em Bali foi perfeita. O Andor levou-nos ao Warung Babi Guling Ibu Oka antes da fila e ainda encaixou um pôr do sol tranquilo em Amed.',
    rating: 5,
    dest: 'Bali'
  },
  {
    name: 'Marta R.',
    avatarColor: '#8B5CF6',
    initials: 'MR',
    city: 'Coimbra',
    date: 'Novembro 2025',
    quote: 'Fui sozinha para Tóquio e mudei os planos no terceiro dia por causa da chuva. A IA trocou Harajuku por Nezu Museum e salvou-me o dia.',
    rating: 5,
    dest: 'Tóquio'
  },
  {
    name: 'Família Costa',
    avatarColor: '#00C9A7',
    initials: 'FC',
    city: 'Braga',
    date: 'Abril 2025',
    quote: 'Viajar com crianças para Paris parecia impossível. O roteiro pôs Luxembourg Gardens entre museus e marcou o Louvre à sexta à noite, sem correria.',
    rating: 5,
    dest: 'Paris'
  },
  {
    name: 'Inês Almeida',
    avatarColor: '#4A9EE8',
    initials: 'IA',
    city: 'Lisboa',
    date: 'Maio 2025',
    quote: 'Queria Roma sem cair no circuito automático. O Andor mandou-nos ao Palazzo Altemps de manhã e deixou o Trastevere só para jantar. Pareceu pensado por alguém de lá.',
    rating: 5,
    dest: 'Roma'
  }
];

const Star = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.star}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

export default function HomeTestimonials() {
  return (
    <section className="section" style={{ background: 'var(--bg-1)' }}>
      <div className="container">
        <div className="text-center animate-fade-in-up" style={{ marginBottom: '64px' }}>
          <span className="section-label">Testemunhos</span>
          <h2 className="section-title">O que dizem os nossos viajantes</h2>
        </div>

        <div className={styles.grid}>
          {testimonials.map((t, i) => (
            <div key={i} className={styles.card} style={{ animationDelay: `${i * 0.15}s` }}>
              <div className={styles.stars}>
                {[...Array(t.rating)].map((_, j) => <Star key={j} />)}
              </div>
              <p className={styles.quote}>{t.quote}</p>
              
              <div className={styles.author}>
                <div className={styles.avatar} style={{ backgroundColor: t.avatarColor }}>
                  {t.initials}
                </div>
                <div className={styles.authorInfo}>
                  <h4>{t.name}</h4>
                  <span>{t.city} · {t.date} · Viagem a {t.dest}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
