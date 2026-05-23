'use client';
import { useEffect, useState } from 'react';
import styles from './ConciergeShowcase.module.css';

export default function ConciergeShowcase() {
  const [step, setStep] = useState(0); // 0 to 4 step sequence

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev >= 4 ? 0 : prev + 1));
    }, 2000); // 2s per step, 8s total active loop

    return () => clearInterval(timer);
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
            <h2 className={styles.title}>O agente de viagens mais inteligente do mundo</h2>
            <p className={styles.desc}>
              Não é um chatbot. É décadas de expertise em viagens, disponível a qualquer hora.
            </p>

            <ul className={styles.bullets}>
              <li className={styles.bulletItem}>
                <span className={styles.bulletIcon}>✦</span>
                <div className={styles.bulletContent}>
                  <strong>Itinerários completos em 30 segundos</strong>
                  <p>Com hotéis, restaurantes, transportes e segredos locais</p>
                </div>
              </li>
              <li className={styles.bulletItem}>
                <span className={styles.bulletIcon}>✦</span>
                <div className={styles.bulletContent}>
                  <strong>Adapta-se ao teu orçamento e estilo</strong>
                  <p>De mochileiro a ultra-luxo, sempre com a mesma precisão</p>
                </div>
              </li>
              <li className={styles.bulletItem}>
                <span className={styles.bulletIcon}>✦</span>
                <div className={styles.bulletContent}>
                  <strong>Resolve problemas em tempo real</strong>
                  <p>Voo cancelado? Hotel fechado? O Andor tem sempre plano B</p>
                </div>
              </li>
            </ul>

            <button 
              type="button" 
              className={styles.ctaBtn}
              onClick={handleOpenConcierge}
            >
              Falar com o Andor →
            </button>
          </div>

          {/* Right Showcase Demo Column */}
          <div className={styles.demoCol}>
            <div className={`${styles.chatWindow} ${step === 0 ? styles.chatFadeOut : ''}`}>
              <div className={styles.chatHeader}>
                <div className={styles.avatar}>✦</div>
                <div className={styles.headerInfo}>
                  <div className={styles.conciergeName}>Andor AI</div>
                  <div className={styles.statusActive}>Conectado 24/7</div>
                </div>
              </div>

              <div className={styles.chatBody}>
                {/* Message 1: User request */}
                {step >= 1 && (
                  <div className={`${styles.message} ${styles.userMessage} ${styles.fadeIn}`}>
                    <p>Planeia 5 dias em Tokyo para 2 pessoas, €1500</p>
                  </div>
                )}

                {/* Message 2: AI response */}
                {step >= 2 && (
                  <div className={`${styles.message} ${styles.aiMessage} ${styles.fadeIn}`}>
                    <p>✨ Itinerário criado — Tokyo · 5 dias · Casal · €1.480</p>
                    <div className={styles.miniCard}>
                      <span style={{ fontSize: '20px' }}>🇯🇵</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Aventura Neon em Shinjuku</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>5 dias · ~€1.480 total</div>
                      </div>
                      <button className={styles.miniBtn} onClick={handleOpenConcierge}>Ver Itinerário</button>
                    </div>
                  </div>
                )}

                {/* Message 3: User follow-up */}
                {step >= 3 && (
                  <div className={`${styles.message} ${styles.userMessage} ${styles.fadeIn}`}>
                    <p>Adiciona uma excursão ao Monte Fuji</p>
                  </div>
                )}

                {/* Message 4: AI response with follow-up changes */}
                {step >= 4 && (
                  <div className={`${styles.message} ${styles.aiMessage} ${styles.fadeIn}`}>
                    <p>Adicionei o Dia 3 com saída às 6:30h para Hakone de Shinkansen, regressando ao final da tarde. Orçamento ajustado.</p>
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
