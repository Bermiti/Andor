'use client';
import styles from './HomeTestimonials.module.css';

const testimonials = [
  {
    name: 'João & Sofia',
    avatarColor: '#E8604A',
    initials: 'JS',
    quote: '"A nossa lua de mel em Bali foi perfeita. O Andor descobriu um restaurante numa falésia que não estava em guia nenhum. Pagámos 15€ por um pôr do sol inesquecível."',
    rating: 5,
    dest: 'Bali'
  },
  {
    name: 'Marta R.',
    avatarColor: '#8B5CF6',
    initials: 'MR',
    quote: '"Fui sozinha para Tóquio e mudei os planos no terceiro dia por causa da chuva. A IA sugeriu instantaneamente uma rota pelas galerias de arte subterrâneas."',
    rating: 5,
    dest: 'Tóquio'
  },
  {
    name: 'Família Costa',
    avatarColor: '#00C9A7',
    initials: 'FC',
    quote: '"Viajar com crianças para Paris parecia impossível. O roteiro incluiu parques a cada 2h e evitou as filas monstruosas do Louvre com passes mágicos."',
    rating: 5,
    dest: 'Paris'
  },
  {
    name: 'Pedro S.',
    avatarColor: '#4A9EE8',
    initials: 'PS',
    quote: '"Estava farto de gastar horas a ler blogs para planear escapadinhas. O Andor fez em 10 segundos o que eu demorava 2 semanas a fazer. É bruxaria."',
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
                  <span>Viagem a {t.dest}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
