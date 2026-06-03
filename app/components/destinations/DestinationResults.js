'use client';

import styles from './DestinationResults.module.css';

export default function DestinationResults({
  recommendations = [],
  userProfile = '',
  wizardData = {},
  onEditPreferences,
  onPlanTrip
}) {
  // Determine color theme of compatibility score badge
  const getScoreClass = (score) => {
    if (score >= 90) return styles.scoreGold;
    if (score >= 80) return styles.scoreTeal;
    return styles.scoreSky;
  };

  // Convert travelStyles to a list of tags for the profile card
  const getProfileTags = () => {
    const tags = [];
    if (wizardData.travelStyles && wizardData.travelStyles.length > 0) {
      wizardData.travelStyles.forEach(s => {
        tags.push({ label: s.charAt(0).toUpperCase() + s.slice(1), icon: '✈️' });
      });
    }
    if (wizardData.travelMonth) {
      tags.push({ label: wizardData.travelMonth, icon: '📅' });
    }
    if (wizardData.budget) {
      tags.push({ label: wizardData.budget.charAt(0).toUpperCase() + wizardData.budget.slice(1), icon: '💰' });
    }
    return tags;
  };

  const profileTags = getProfileTags();

  return (
    <div className={styles.container}>
      {/* Profile Card Summary */}
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.profileIcon}>✦</div>
          <h2 className={styles.profileTitle}>O Teu Perfil de Viajante</h2>
        </div>
        <p className={styles.profileText}>
          {userProfile || 'Analisámos as tuas preferências de viagem para encontrar os destinos ideais para a tua próxima aventura.'}
        </p>
        
        {profileTags.length > 0 && (
          <div className={styles.profileTags}>
            {profileTags.map((tag, idx) => (
              <span key={idx} className={styles.profileTag}>
                <span>{tag.icon}</span> {tag.label}
              </span>
            ))}
          </div>
        )}

        <button className={styles.editBtn} onClick={onEditPreferences}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          Ajustar Preferências
        </button>
      </div>

      {/* Recommendations Section Header */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Destinos Recomendados</h2>
        <span className={styles.countBadge}>{recommendations.length}</span>
      </div>

      {/* Empty State */}
      {recommendations.length === 0 ? (
        <div className={styles.profileCard} style={{ textAlign: 'center', padding: '48px' }}>
          <p className={styles.profileText}>Não encontrámos nenhum destino compatível com os teus filtros estritos. Tenta alargar as tuas preferências.</p>
          <button className={styles.editBtn} onClick={onEditPreferences}>Ajustar Preferências</button>
        </div>
      ) : (
        /* Results Grid */
        <div className={styles.grid}>
          {recommendations.map((dest, index) => {
            const scoreClass = getScoreClass(dest.score);
            return (
              <div key={dest.name + index} className={styles.card}>
                {/* Score Badge */}
                <div className={`${styles.scoreBadge} ${scoreClass}`}>
                  <div>
                    {dest.score}%
                    <span className={styles.scoreLabel}>Match</span>
                  </div>
                </div>

                {/* Card Title & Header */}
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardName}>{dest.name}</h3>
                  <p className={styles.cardCountry}>{dest.country}</p>
                </div>

                {/* Destination Tags */}
                {dest.tags && dest.tags.length > 0 && (
                  <div className={styles.tags}>
                    {dest.tags.map((tag, idx) => (
                      <span key={idx} className={styles.tag}>#{tag}</span>
                    ))}
                  </div>
                )}

                {/* Explanation */}
                <p className={styles.explanation}>{dest.explanation}</p>

                {/* Metadata Grid (Duration, Budget, Best Time) */}
                <div className={styles.metaGrid}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaIcon}>⏳</span>
                    <span className={styles.metaLabel}>Duração</span>
                    <span className={styles.metaValue}>{dest.idealDuration || '5-7 dias'}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaIcon}>💸</span>
                    <span className={styles.metaLabel}>Orçamento</span>
                    <span className={styles.metaValue}>{dest.estimatedBudget || 'Moderado'}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaIcon}>☀️</span>
                    <span className={styles.metaLabel}>Melhor Época</span>
                    <span className={styles.metaValue}>{dest.bestTime || 'Abril a Outubro'}</span>
                  </div>
                </div>

                {/* Strengths / Pontos Fortes */}
                {dest.strengths && dest.strengths.length > 0 && (
                  <div>
                    <h4 className={styles.strengthsTitle}>Destaques / Pontos Fortes</h4>
                    <ul className={styles.strengthsList}>
                      {dest.strengths.map((str, idx) => (
                        <li key={idx} className={styles.strengthItem}>
                          <span className={styles.strengthDot}></span>
                          {str}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Considerations / Drawbacks */}
                {dest.consideration && (
                  <div className={styles.consideration}>
                    <span className={styles.considerationIcon}>⚠️</span>
                    <p className={styles.considerationText}>{dest.consideration}</p>
                  </div>
                )}

                {/* Plan button (creates an itinerary) */}
                <button 
                  className={styles.planBtn} 
                  onClick={() => onPlanTrip(dest.name + ', ' + dest.country)}
                >
                  Planear Viagem
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
