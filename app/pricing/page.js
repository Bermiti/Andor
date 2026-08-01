'use client';

import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { trackEvent } from '../lib/analytics';
import styles from './pricing.module.css';

export default function PricingPage() {
  useEffect(() => {
    document.title = 'Acesso pré-lançamento · Andor';
    trackEvent('page_view', { page: 'pricing', release_stage: 'prelaunch' });
  }, []);

  const requestUpdates = () => {
    trackEvent('prelaunch_updates_click');
    window.dispatchEvent(new Event('open-custom-request'));
  };

  return (
    <>
      <Navbar />
      <main className={styles.container}>
        <section className={styles.hero}>
          <h1 className={styles.title}>Andor está em pré-lançamento</h1>
          <p className={styles.subtitle}>
            Ainda não existem subscrições, testes pagos ou cobrança. A prioridade atual é validar o planeamento e a qualidade dos dados.
          </p>
        </section>

        <div className={styles.grid}>
          <article className={`${styles.card} ${styles.featuredCard}`}>
            <span className={styles.popularBadge}>Disponível agora</span>
            <div className={styles.cardHeader}>
              <h2 className={styles.planName}>Protótipo</h2>
              <div className={styles.priceWrapper}>
                <span className={styles.price}>Sem cobrança</span>
              </div>
              <div className={styles.yearlyNote}>Acesso sujeito ao estado do ambiente</div>
            </div>
            <ul className={styles.featuresList}>
              <li className={styles.featureItem}><span className={styles.checkIcon}>✓</span><span>Criar e editar propostas de itinerário</span></li>
              <li className={styles.featureItem}><span className={styles.checkIcon}>✓</span><span>Mapa das paragens com coordenadas disponíveis</span></li>
              <li className={styles.featureItem}><span className={styles.checkIcon}>✓</span><span>Checklist e links de pesquisa externa</span></li>
              <li className={styles.featureItem}><span className={styles.checkIcon}>✓</span><span>Exportação e partilha para avaliação</span></li>
            </ul>
            <a href="/?wizard=true" className={`${styles.btn} ${styles.btnPro}`}>Experimentar o planeador</a>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.planName}>Planos futuros</h2>
              <div className={styles.yearlyNote}>Sem preço ou data anunciados</div>
            </div>
            <ul className={styles.featuresList}>
              <li className={styles.featureItem}><span className={styles.checkIcon}>→</span><span>Billing e limites de utilização ainda não implementados</span></li>
              <li className={styles.featureItem}><span className={styles.checkIcon}>→</span><span>Colaboração e alertas dependem de validação futura</span></li>
              <li className={styles.featureItem}><span className={styles.checkIcon}>→</span><span>Qualquer oferta comercial será publicada com termos claros</span></li>
            </ul>
            <button type="button" onClick={requestUpdates} className={`${styles.btn} ${styles.btnAgency}`}>
              Pedir atualizações
            </button>
          </article>
        </div>

        <section className={styles.faqSection}>
          <h2 className={styles.faqTitle}>O que significa pré-lançamento?</h2>
          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <div className={styles.faqHeader}><span>O Andor faz reservas?</span></div>
              <div className={`${styles.faqContent} ${styles.faqContentActive}`}><p>Não. Organiza o plano e abre pesquisas externas; confirmações e pagamentos acontecem fora do Andor.</p></div>
            </div>
            <div className={styles.faqItem}>
              <div className={styles.faqHeader}><span>Os preços e horários são garantidos?</span></div>
              <div className={`${styles.faqContent} ${styles.faqContentActive}`}><p>Não. Só dados associados a uma fonte identificada devem ser tratados como dados externos, e mesmo esses têm de ser confirmados antes da compra.</p></div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
