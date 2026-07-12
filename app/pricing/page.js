'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { trackEvent } from '../lib/analytics';
import styles from './pricing.module.css';

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    document.title = "Preços · Andor Travels";
    trackEvent('page_view', { page: 'pricing' });
  }, []);

  const toggleBilling = () => {
    const nextVal = !isYearly;
    setIsYearly(nextVal);
    trackEvent('pricing_toggle', { billing_cycle: nextVal ? 'yearly' : 'monthly' });
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Como funciona o teste gratuito do plano Pro?",
      a: "O teste gratuito dura 7 dias e dá-te acesso total a todas as funcionalidades Pro. Podes cancelar a qualquer momento sem custos."
    },
    {
      q: "Posso cancelar ou alterar o meu plano quando quiser?",
      a: "Sim! Não temos períodos de fidelização. Podes fazer upgrade, downgrade ou cancelar a tua subscrição diretamente nas configurações do teu perfil."
    },
    {
      q: "O que está incluído nos 'destinos básicos' do plano gratuito?",
      a: "O plano gratuito inclui acesso aos destinos mais populares como Lisboa, Paris e Londres. Os planos pagos desbloqueiam mais de 80 destinos em todo o mundo e itinerários fora das rotas turísticas comuns."
    },
    {
      q: "Como funciona a exportação de PDF no plano Pro?",
      a: "No plano Pro, recebes um PDF premium completo, formatado para impressão ou leitura em dispositivos móveis, com endereços, prioridades de reserva, custos e notas de segredos locais do Andor."
    },
    {
      q: "O que é o suporte a multi-clientes no plano Agency?",
      a: "O plano Agency foi desenhado para agências de viagens e criadores de conteúdos que planeiam viagens para outros. Permite organizar itinerários por cliente, adicionar a tua marca (white-label) e partilhar links personalizados."
    },
    {
      q: "Os itinerários gerados expiram?",
      a: "Não. Qualquer itinerário que guardares na tua conta ficará disponível para sempre, independentemente do plano ativo."
    }
  ];

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Andor Travels Pro",
    "description": "Itinerários de viagem ilimitados e concierge de viagem com IA disponível 24 horas por dia.",
    "image": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=75&auto=format&fit=crop",
    "offers": {
      "@type": "Offer",
      "price": "9.00",
      "priceCurrency": "EUR",
      "priceValidUntil": "2028-12-31",
      "availability": "https://schema.org/InStock",
      "url": "https://andor.travels/pricing"
    }
  };

  return (
    <>
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <Navbar />
      <main className={styles.container}>
        {/* HERO SECTION */}
        <section className={styles.hero}>
          <h1 className={styles.title}>Planos Simples para Grandes Aventuras</h1>
          <p className={styles.subtitle}>
            Escolhe o nível de inteligência e liberdade que a tua próxima viagem merece.
          </p>
        </section>

        {/* BILLING TOGGLE */}
        <div className={styles.billingToggleWrapper}>
          <span 
            className={`${styles.toggleLabel} ${!isYearly ? styles.toggleLabelActive : ''}`}
            onClick={() => setIsYearly(false)}
          >
            Facturação Mensal
          </span>
          
          <button 
            className={`${styles.toggleSwitch} ${isYearly ? styles.toggleSwitchChecked : ''}`}
            onClick={toggleBilling}
            aria-label="Alternar facturação"
          >
            <span className={`${styles.toggleThumb} ${isYearly ? styles.toggleThumbChecked : ''}`}></span>
          </button>
          
          <span 
            className={`${styles.toggleLabel} ${isYearly ? styles.toggleLabelActive : ''}`}
            onClick={() => setIsYearly(true)}
          >
            Facturação Anual
          </span>
          
          <span className={styles.discountBadge}>Poupe 27%</span>
        </div>

        {/* PRICING GRID */}
        <div className={styles.grid}>
          {/* FREE TIER */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.planName}>Free</h2>
              <div className={styles.priceWrapper}>
                <span className={styles.price}>€0</span>
                <span className={styles.period}>/mês</span>
              </div>
              <div className={styles.yearlyNote}>Acesso gratuito vitalício</div>
            </div>
            
            <ul className={styles.featuresList}>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>3 itinerários por mês</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Destinos básicos</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>AI Concierge (10 msgs/dia)</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Export PDF básico</span>
              </li>
            </ul>
            
            <a 
              href="/?wizard=true" 
              className={`${styles.btn} ${styles.btnFree}`}
              onClick={() => trackEvent('pricing_click', { tier: 'free' })}
            >
              Começar Grátis
            </a>
          </div>

          {/* PRO TIER (FEATURED) */}
          <div className={`${styles.card} ${styles.featuredCard}`}>
            <span className={styles.popularBadge}>Mais Popular</span>
            <div className={styles.cardHeader}>
              <h2 className={styles.planName}>Pro</h2>
              <div className={styles.priceWrapper}>
                <span className={styles.price}>
                  {isYearly ? '€6.58' : '€9'}
                </span>
                <span className={styles.period}>/mês</span>
              </div>
              <div className={styles.yearlyNote}>
                {isYearly ? 'Facturado anualmente: €79/ano' : 'Cancele a qualquer momento'}
              </div>
            </div>
            
            <ul className={styles.featuresList}>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <strong>Itinerários ilimitados</strong>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <strong>Todos os destinos premium</strong>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <strong>AI Concierge ilimitado</strong>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <strong>Export PDF premium</strong>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Colaboração em tempo real</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Alertas de preços de voos</span>
              </li>
            </ul>
            
            <button 
              onClick={() => {
                trackEvent('pricing_click', { tier: 'pro' });
                window.dispatchEvent(new Event('open-ai-chat'));
              }}
              className={`${styles.btn} ${styles.btnPro}`}
            >
              Começar Pro — 7 dias grátis
            </button>
          </div>

          {/* AGENCY TIER */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.planName}>Agency</h2>
              <div className={styles.priceWrapper}>
                <span className={styles.price}>€49</span>
                <span className={styles.period}>/mês</span>
              </div>
              <div className={styles.yearlyNote}>Ideal para equipas e consultores</div>
            </div>
            
            <ul className={styles.featuresList}>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <strong>Tudo do Pro incluído</strong>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Multi-clientes e equipas</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>White-label disponível</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Acesso total à API do Andor</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Dashboard de analytics completo</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Suporte prioritário 24/7</span>
              </li>
            </ul>
            
            <button 
              onClick={() => {
                trackEvent('pricing_click', { tier: 'agency' });
                window.dispatchEvent(new Event('open-custom-request'));
              }}
              className={`${styles.btn} ${styles.btnAgency}`}
            >
              Contactar para Demo
            </button>
          </div>
        </div>

        {/* FAQ SECTION */}
        <section className={styles.faqSection}>
          <h2 className={styles.faqTitle}>Perguntas Frequentes</h2>
          <div className={styles.faqList}>
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className={styles.faqItem}>
                  <button 
                    className={styles.faqHeader}
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <span className={`${styles.faqChevron} ${isOpen ? styles.faqChevronActive : ''}`}>
                      ▼
                    </span>
                  </button>
                  <div className={`${styles.faqContent} ${isOpen ? styles.faqContentActive : ''}`}>
                    <p>{faq.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
