'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DestinationWizard from '../components/destinations/DestinationWizard';
import DestinationResults from '../components/destinations/DestinationResults';
import DestinationChat from '../components/destinations/DestinationChat';
import { useTranslations, useLanguage } from '../context/LanguageContext';
import styles from './page.module.css';

export default function DestinationsPage() {
  const t = useTranslations('destinations');
  const { locale } = useLanguage();

  // Page phase: 'hero' → 'wizard' → 'loading' → 'results'
  const [pagePhase, setPagePhase] = useState('hero');
  const [wizardData, setWizardData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [userProfile, setUserProfile] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingTip, setLoadingTip] = useState(0);
  const resultsRef = useRef(null);

  const loadingTips = [
    t('loadingTip1') || 'A analisar as tuas preferências...',
    t('loadingTip2') || 'A comparar centenas de destinos...',
    t('loadingTip3') || 'A calcular compatibilidade...',
    t('loadingTip4') || 'A preparar recomendações personalizadas...',
  ];

  // Animate loading progress
  useEffect(() => {
    if (pagePhase !== 'loading') return;
    
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval); return 90; }
        return prev + Math.random() * 15;
      });
    }, 400);

    const tipInterval = setInterval(() => {
      setLoadingTip(prev => (prev + 1) % loadingTips.length);
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(tipInterval);
    };
  }, [pagePhase]);

  // Set page title
  useEffect(() => {
    document.title = t('pageTitle') || 'Destinos · Andor';
  }, [t]);

  const handleStartWizard = useCallback(() => {
    setPagePhase('wizard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleWizardComplete = useCallback(async (data) => {
    setWizardData(data);
    setPagePhase('loading');
    setLoadingProgress(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const response = await fetch('/api/recommend-destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: data, locale }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      
      setLoadingProgress(100);
      
      // Short delay for the progress bar to finish
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setRecommendations(result.destinations || []);
      setUserProfile(result.userProfile || '');
      setPagePhase('results');

      // Scroll to top of results
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Recommendation error:', error);
      // Fallback: still show results phase with empty state
      setPagePhase('results');
      setRecommendations([]);
      setUserProfile('');
    }
  }, [locale]);

  const handleBackToHero = useCallback(() => {
    setPagePhase('hero');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleEditPreferences = useCallback(() => {
    setPagePhase('wizard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePlanTrip = useCallback((destinationName) => {
    // Dispatch event to open the CreationWizard with destination pre-filled
    window.dispatchEvent(new CustomEvent('andor-search-trigger', {
      detail: { destination: destinationName }
    }));
  }, []);

  return (
    <div className={styles.pageShell}>
      <Navbar />
      <main className={styles.main}>

        {/* ═══════════ HERO PHASE ═══════════ */}
        {pagePhase === 'hero' && (
          <section key="destinations-hero" className={styles.hero}>
            <div className={styles.heroBackground}>
              <div className={styles.heroOverlay} />
              <div className={styles.heroGlow} />
            </div>
            <div className={styles.heroContent}>
              <span className={styles.heroBadge}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={styles.heroBadgeIcon}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                {t('heroBadge') || 'Destinos'}
              </span>
              <h1 className={styles.heroTitle}>
                {t('heroTitle') || 'Encontra o Destino'}{' '}
                <span className={styles.heroTitleAccent}>{t('heroTitleAccent') || 'Ideal'}</span>
              </h1>
              <p className={styles.heroSubtitle}>
                {t('heroSubtitle') || 'Responde a algumas perguntas e recebe recomendações personalizadas com base nas tuas preferências, orçamento e estilo de viagem.'}
              </p>
              <button className={styles.heroCta} onClick={handleStartWizard}>
                <span>{t('heroCta') || 'Começar'}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.heroCtaIcon}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <div className={styles.heroTrust}>
                <div className={styles.trustAvatars}>
                  <div className={styles.trustAvatar} style={{ background: 'linear-gradient(135deg, #D4A843, #F0C96A)' }}>✦</div>
                  <div className={styles.trustAvatar} style={{ background: 'linear-gradient(135deg, #E8604A, #FF7A5C)' }}>✦</div>
                  <div className={styles.trustAvatar} style={{ background: 'linear-gradient(135deg, #00C9A7, #4AE8C8)' }}>✦</div>
                </div>
                <span className={styles.trustText}>
                  Roteiro, orçamento e reservas no mesmo fluxo
                </span>
              </div>
            </div>

            {/* Decorative elements */}
            <div className={styles.heroDecor}>
              <div className={styles.decorLine} />
              <div className={styles.decorDot} />
              <div className={styles.decorLine} />
            </div>
          </section>
        )}

        {/* ═══════════ WIZARD PHASE ═══════════ */}
        {pagePhase === 'wizard' && (
          <section key="destinations-wizard" className={styles.wizardSection}>
            <DestinationWizard
              onComplete={handleWizardComplete}
              onBack={handleBackToHero}
              initialData={wizardData}
            />
          </section>
        )}

        {/* ═══════════ LOADING PHASE ═══════════ */}
        {pagePhase === 'loading' && (
          <section key="destinations-loading" className={styles.loadingSection}>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingIcon}>
                <svg viewBox="0 0 24 24" fill="none" className={styles.loadingGlobe}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 12h20" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <h2 className={styles.loadingTitle}>
                {t('loadingTitle') || 'A analisar o teu perfil...'}
              </h2>
              <p className={styles.loadingTip}>
                {loadingTips[loadingTip]}
              </p>
              <div className={styles.progressBarContainer}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${Math.min(loadingProgress, 100)}%` }}
                />
              </div>
              <span className={styles.progressLabel}>
                {Math.round(Math.min(loadingProgress, 100))}%
              </span>
            </div>
          </section>
        )}

        {/* ═══════════ RESULTS PHASE ═══════════ */}
        {pagePhase === 'results' && (
          <section key="destinations-results" className={styles.resultsSection} ref={resultsRef}>
            <DestinationResults
              recommendations={recommendations}
              userProfile={userProfile}
              wizardData={wizardData}
              onEditPreferences={handleEditPreferences}
              onPlanTrip={handlePlanTrip}
            />

            {recommendations.length > 0 && (
              <div className={styles.chatSection}>
                <DestinationChat
                  wizardData={wizardData}
                  recommendations={recommendations}
                />
              </div>
            )}
          </section>
        )}

      </main>
      <Footer />
    </div>
  );
}
