'use client';
import { useEffect, useState } from 'react';
import styles from './ConciergeShowcase.module.css';

export default function ConciergeShowcase() {
  const [chatState, setChatState] = useState(0); // 0: Question, 1: Typing, 2: Streaming, 3: Card

  useEffect(() => {
    // 8s total loop:
    // 0.0s - 1.8s: typing question
    // 1.8s - 2.8s: AI thinking (dots pulsing)
    // 2.8s - 5.8s: AI text streaming
    // 5.8s - 7.8s: Visual Card fade-in
    // 7.8s - 8.0s: hold/reset
    const interval = setInterval(() => {
      setChatState((prev) => (prev + 1) % 4);
    }, 2000); // 4 states * 2s each roughly

    return () => clearInterval(interval);
  }, []);

  const handleOpenConcierge = () => {
    window.dispatchEvent(new Event('open-ai-chat'));
  };

  return (
    <section className={styles.section} id="concierge">
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Left Text Column */}
          <div className={styles.textCol}>
            <span className={styles.label}>CONCIERGE DE VIAGENS</span>
            <h2 className={styles.title}>Planeamento que parece mágica</h2>
            <p className={styles.desc}>
              Não é um chatbot genérico. É o agente de viagens mais inteligente do mundo, disponível 24/7 para desenhar a tua jornada perfeita.
            </p>

            <ul className={styles.bullets}>
              <li className={styles.bulletItem}>
                <span className={styles.bulletIcon}>✦</span>
                <span className={styles.bulletText}>Itinerários hora-a-hora em 30 segundos</span>
              </li>
              <li className={styles.bulletItem}>
                <span className={styles.bulletIcon}>✦</span>
                <span className={styles.bulletText}>Hotéis, voos e restaurantes em contexto real</span>
              </li>
              <li className={styles.bulletItem}>
                <span className={styles.bulletIcon}>✦</span>
                <span className={styles.bulletText}>Adapta-se ao teu orçamento e estilo pessoal</span>
              </li>
            </ul>

            <button 
              type="button" 
              className={styles.ctaBtn}
              onClick={handleOpenConcierge}
            >
              Fala com o Andor →
            </button>
          </div>

          {/* Right Showcase Demo Column */}
          <div className={styles.demoCol}>
            <div className={styles.chatWindow}>
              <div className={styles.chatHeader}>
                <div className={styles.avatar}>✦</div>
                <div className={styles.headerInfo}>
                  <div className={styles.conciergeName}>Andor AI</div>
                  <div className={styles.statusActive}>Conectado 24/7</div>
                </div>
              </div>

              <div className={styles.chatBody}>
                {/* User Message */}
                <div className={`${styles.message} ${styles.userMessage} ${chatState >= 0 ? styles.visible : ''}`}>
                  <p>Prepara-me um dia incrível em Tóquio.</p>
                </div>

                {/* AI Thinking Indicator */}
                {chatState === 1 && (
                  <div className={`${styles.message} ${styles.aiMessage} ${styles.thinking}`}>
                    <div className={styles.dot}></div>
                    <div className={styles.dot}></div>
                    <div className={styles.dot}></div>
                  </div>
                )}

                {/* AI Text Response */}
                {chatState >= 2 && (
                  <div className={`${styles.message} ${styles.aiMessage} ${styles.visible}`}>
                    <p>
                      Com todo o gosto! Para o teu dia em Tóquio, sugiro explorar o contraste entre o moderno e o tradicional de forma fluída:
                    </p>
                  </div>
                )}

                {/* Visual Card Result */}
                {chatState >= 3 && (
                  <div className={`${styles.inlineCard} ${styles.cardVisible}`}>
                    <div className={styles.cardHeader}>
                      <span className={styles.cardBadge}>✨ ITINERÁRIO DISPONÍVEL</span>
                      <h4 className={styles.cardTitle}>Manhã Mística em Yanaka</h4>
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.cardDetail}>
                        <strong>06:47</strong> — Yanaka Cemetery Walk (Evita as multidões)
                      </div>
                      <div className={styles.cardDetail}>
                        <strong>08:30</strong> — Pequeno-almoço no Kayaba Coffee
                      </div>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.scoreText}>Andor Score: 98/100</span>
                      <button 
                        type="button" 
                        className={styles.cardBtn}
                        onClick={handleOpenConcierge}
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
