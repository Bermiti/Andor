'use client';
import styles from './Testemunhos.module.css';

const TESTIMONIALS = [
  {
    name: "Sofia Mendes",
    city: "Lisboa",
    destination: "Tóquio 7 dias",
    text: "Nunca pensei que conseguia planear uma viagem ao Japão sozinha. O Andor fez um itinerário tão detalhado que me senti guiada em cada momento — até me recomendou o bar escondido no Golden Gai que se tornou o highlight da viagem.",
    rating: 5,
    date: "Março 2025",
    avatar: "SM",
    avatarColor: "#D4A843"
  },
  {
    name: "Miguel & Ana Rodrigues",
    city: "Porto",
    destination: "Bali 10 dias lua de mel",
    text: "O Andor encontrou um resort que nunca encontraríamos sozinhos — dentro do nosso orçamento e exactamente o estilo que descrevemos. Cada restaurante que recomendou foi uma experiência única.",
    rating: 5,
    date: "Fevereiro 2025",
    avatar: "MA",
    avatarColor: "#E8604A"
  },
  {
    name: "Carlos Ferreira",
    city: "Braga",
    destination: "Nova Iorque 5 dias",
    text: "Viagem de negócios com 2 dias livres. O Andor optimizou cada hora — de manhã cedo em Central Park, almoço num diner local que os nova-iorquinos frequentam, e uma experiência no topo do Empire State ao anoitecer. Perfeito.",
    rating: 5,
    date: "Abril 2025",
    avatar: "CF",
    avatarColor: "#00C9A7"
  },
  {
    name: "Inês Costa",
    city: "Faro",
    destination: "Marrocos 6 dias",
    text: "Tinha medo de ir sozinha para Marrocos. O Andor não só planeou um itinerário seguro e emocionante como me deu dicas culturais que tornaram cada interacção com os locais genuína. Voltei completamente transformada.",
    rating: 5,
    date: "Outubro 2024",
    avatar: "IC",
    avatarColor: "#8B5CF6"
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
                  style={{ backgroundColor: t.avatarColor, color: '#fff', fontWeight: 'bold' }}
                >
                  {t.avatar}
                </div>
                <div className={styles.meta}>
                  <h3 className={styles.name}>{t.name}</h3>
                  <span className={styles.cityInfo}>{t.city} · <span className={styles.destName}>{t.destination}</span></span>
                </div>
              </div>

              <div className={styles.stars}>
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className={styles.star}>★</span>
                ))}
              </div>

              <p className={styles.text}>&ldquo;{t.text}&rdquo;</p>

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
