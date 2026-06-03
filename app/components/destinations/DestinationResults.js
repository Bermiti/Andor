'use client';

import { useTranslations } from '../../context/LanguageContext';
import styles from './DestinationResults.module.css';

export default function DestinationResults({
  recommendations = [],
  userProfile = '',
  wizardData = {},
  onEditPreferences,
  onPlanTrip
}) {
  const t = useTranslations('destinations');

  // Helper to get budget label
  const getBudgetLabel = () => {
    if (!wizardData) return '';
    const b = wizardData.budget;
    const type = wizardData.budgetType === 'person' ? ` (${t('budgetPerPerson') || 'Por pessoa'})` : ` (${t('budgetTotal') || 'Total'})`;
    
    switch (b) {
      case 'economic': return `${t('budgetEconomic') || 'Económico'}${type}`;
      case 'moderate': return `${t('budgetModerate') || 'Moderado'}${type}`;
      case 'comfortable': return `${t('budgetComfortable') || 'Confortável'}${type}`;
      case 'premium': return `${t('budgetPremium') || 'Premium'}${type}`;
      case 'luxury': return `${t('budgetLuxury') || 'Luxo'}${type}`;
      default: return '';
    }
  };

  // Helper to get month label
  const getMonthLabel = () => {
    if (!wizardData) return '';
    const m = wizardData.travelMonth;
    if (m === 'flexible') return t('monthFlexible') || 'Flexível';
    
    const monthKeys = {
      january: 'monthJan', february: 'monthFeb', march: 'monthMar',
      april: 'monthApr', may: 'monthMay', june: 'monthJun',
      july: 'monthJul', august: 'monthAug', september: 'monthSep',
      october: 'monthOct', november: 'monthNov', december: 'monthDec'
    };
    return t(monthKeys[m]) || m;
  };

  // Helper to get travelers label
  const getTravelersLabel = () => {
    if (!wizardData || !wizardData.travelers) return '';
    const count = wizardData.travelers;
    return `${count} ${count === 1 ? (t('travelersSingular') || 'viajante') : (t('travelersPlural') || 'viajantes')}`;
  };

  // Helper for style tags
  const getStyleLabels = () => {
    if (!wizardData || !wizardData.travelStyles) return [];
    const styleKeys = {
      beach: 'styleBeach', city: 'styleCity', nature: 'styleNature',
      adventure: 'styleAdventure', culture: 'styleCulture', gastronomy: 'styleGastronomy',
      luxury: 'styleLuxury', relax: 'styleRelax', romantic: 'styleRomantic',
      family: 'styleFamily', friends: 'styleFriends', nightlife: 'styleNightlife'
    };
    return wizardData.travelStyles.map(s => t(styleKeys[s]) || s);
  };

  const scoreClass = (score) => {
    if (score >= 90) return styles.scoreGold;
    if (score >= 80) return styles.scoreTeal;
    return styles.scoreSky;
  };

  return (
    <div className={styles.container}>
      {/* ═══════════ PROFILE SUMMARY CARD ═══════════ */}
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.profileIcon}>🧭</div>
          <h3 className={styles.profileTitle}>{t('profileTitle') || 'O teu perfil de viagem'}</h3>
        </div>
        <p className={styles.profileText}>{userProfile}</p>
        
        <div className={styles.profileTags}>
          {wizardData.departureCity && (
            <span className={styles.profileTag}>🛫 {wizardData.departureCity}</span>
          )}
          {getMonthLabel() && (
            <span className={styles.profileTag}>📅 {getMonthLabel()}</span>
          )}
          {wizardData.duration && (
            <span className={styles.profileTag}>⏱️ {wizardData.duration} dias</span>
          )}
          {getTravelersLabel() && (
            <span className={styles.profileTag}>👥 {getTravelersLabel()}</span>
          )}
          {getBudgetLabel() && (
            <span className={styles.profileTag}>💰 {getBudgetLabel()}</span>
          )}
          {getStyleLabels().map((sLabel, idx) => (
            <span key={idx} className={styles.profileTag}>✨ {sLabel}</span>
          ))}
        </div>
        
        <button className={styles.editBtn} onClick={onEditPreferences}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          {t('profileEdit') || 'Editar preferências'}
        </button>
      </div>

      {/* ═══════════ DESTINATION CARDS GRID ═══════════ */}
      <div>
        <div className={styles.profileHeader} style={{ marginBottom: '24px' }}>
          <h3 className={styles.sectionTitle}>{t('recommendedTitle') || 'Destinos Recomendados'}</h3>
          {recommendations.length > 0 && (
            <span className={styles.countBadge}>{recommendations.length}</span>
          )}
        </div>

        {recommendations.length === 0 ? (
          <div className={styles.profileCard} style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p className={styles.profileText} style={{ fontSize: '1.1rem' }}>
              {t('noRecommendations') || 'Não encontrámos destinos correspondentes às tuas preferências. Tenta alargar os teus critérios.'}
            </p>
            <button className={styles.editBtn} onClick={onEditPreferences} style={{ marginTop: '16px' }}>
              {t('profileEdit') || 'Editar preferências'}
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {recommendations.map((item, index) => (
              <div key={item.name + '-' + index} className={styles.card}>
                {/* Score Badge */}
                <div className={`${styles.scoreBadge} ${scoreClass(item.score)}`}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>{item.score}%</span>
                    <span className={styles.scoreLabel}>{t('scoreLabel') || 'compatível'}</span>
                  </div>
                </div>

                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <h4 className={styles.cardName}>{item.name}</h4>
                  <h5 className={styles.cardCountry}>{item.country}</h5>
                </div>

                {/* Tags */}
                <div className={styles.tags}>
                  {item.tags && item.tags.map((tag, tIdx) => (
                    <span key={tIdx} className={styles.tag}>{tag}</span>
                  ))}
                </div>

                {/* Explanation */}
                <p className={styles.explanation}>{item.explanation}</p>

                {/* Meta Grid */}
                <div className={styles.metaGrid}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaIcon}>📅</span>
                    <span className={styles.metaLabel}>{t('idealDuration') || 'Duração'}</span>
                    <span className={styles.metaValue}>{item.idealDuration}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaIcon}>💰</span>
                    <span className={styles.metaLabel}>{t('estimatedBudget') || 'Orçamento'}</span>
                    <span className={styles.metaValue}>{item.estimatedBudget}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaIcon}>☀️</span>
                    <span className={styles.metaLabel}>{t('bestTime') || 'Melhor Altura'}</span>
                    <span className={styles.metaValue}>{item.bestTime}</span>
                  </div>
                </div>

                {/* Strengths */}
                <h5 className={styles.strengthsTitle}>{t('strengths') || 'Pontos fortes'}</h5>
                <ul className={styles.strengthsList}>
                  {item.strengths && item.strengths.map((str, sIdx) => (
                    <li key={sIdx} className={styles.strengthItem}>
                      <span className={styles.strengthDot} />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>

                {/* Considerations */}
                {item.consideration && (
                  <div className={styles.consideration}>
                    <span className={styles.considerationIcon}>⚠️</span>
                    <p className={styles.considerationText}>
                      <strong>{t('consideration') || 'A considerar'}:</strong> {item.consideration}
                    </p>
                  </div>
                )}

                {/* Action button */}
                <button className={styles.planBtn} onClick={() => onPlanTrip(item.name)}>
                  {t('planTrip') || 'Planear esta viagem'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
