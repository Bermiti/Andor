'use client';
import styles from './Testemunhos.module.css';

const TESTIMONIALS = [
  {
    name: 'Sofia M.',
    route: 'Lisboa ➔ Tóquio',
    avatarLetter: 'S',
    avatarColor: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
    text: 'O Andor planeou 7 dias em Tóquio com um orçamento que eu achava impossível. Cada recomendação de restaurante era uma autêntica descoberta local.',
    rating: 5,
    date: 'Maio 2026'
  },
  {
    name: 'Miguel R.',
    route: 'Porto ➔ Bali',
    avatarLetter: 'M',
    avatarColor: 'linear-gradient(135deg, #4EA8DE, #5E60CE)',
    text: 'Nunca tinha viajado totalmente sozinho. O AI deu-me uma confiança incrível e um plano de rota tão detalhado que me senti sempre super seguro.',
    rating: 5,
    date: 'Abril 2026'
  },
  {
    name: 'Ana & Pedro',
    route: 'Lisboa ➔ Maldivas',
    avatarLetter: 'A',
    avatarColor: 'linear-gradient(135deg, #11998e, #38ef7d)',
    text: 'Viagem de lua de mel perfeita. O Andor encontrou o resort ecológico dos nossos sonhos e geriu os tempos de transferes com precisão cirúrgica.',
    rating: 5,
    date: 'Maio 2026'
  }
];

export default function Testemunhos() {
  return (
    <section className={styles.section} id="testemunhos">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.label}>Experiências Reais</span>
          <h2 className={styles.title}>Quem viaja com o Andor</h2>
          <p className={styles.subtitle}>
            Junta-te a milhares de viajantes que redefiniram as suas aventuras com o nosso concierge inteligente.
          </p>
        </div>

        <div className={styles.grid}>
          {TESTIMONIALS.map((t, idx) => (
            <div key={idx} className={styles.card}>
              <div className={styles.cardHeader}>
                <div 
                  className={styles.avatar}
                  style={{ background: t.avatarColor }}
                >
                  {t.avatarLetter}
                </div>
                <div className={styles.meta}>
                  <h3 className={styles.name}>{t.name}</h3>
                  <span className={styles.route}>{t.route}</span>
                </div>
              </div>

              <div className={styles.stars}>
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className={styles.star}>★</span>
                ))}
              </div>

              <p className={styles.text}>"{t.text}"</p>

              <div className={styles.cardFooter}>
                <span className={styles.date}>{t.date}</span>
                <span className={styles.verified}>✓ Utilizador Verificado</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
