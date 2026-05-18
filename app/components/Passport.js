import styles from './Passport.module.css';

export default function Passport() {
  const stats = [
    { label: 'Countries', value: '14' },
    { label: 'Trips', value: '38' },
    { label: 'Photos', value: '1.2K' },
    { label: 'Followers', value: '4.5K' },
  ];

  const badges = [
    { icon: '🍜', title: 'Foodie', color: '#FFF7ED' },
    { icon: '🏔️', title: 'Hiker', color: '#ECFDF5' },
    { icon: '🏛️', title: 'Historian', color: '#EBF5FF' },
    { icon: '🎭', title: 'Art Lover', color: '#FDF2F8' },
  ];

  return (
    <div className={styles.passportCard}>
      <div className={styles.cardHeader}>
        <div className={styles.userMain}>
          <div className={styles.avatar}>👨‍🚀</div>
          <div className={styles.userInfo}>
            <h3 className={styles.userName}>Alex Rivera</h3>
            <p className={styles.userHandle}>@explorer_alex</p>
          </div>
        </div>
        <div className={styles.levelBadge}>Level 24</div>
      </div>

      <div className={styles.statsGrid}>
        {stats.map(s => (
          <div key={s.label} className={styles.statItem}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.divider}></div>

      <div className={styles.badgesSection}>
        <h4 className={styles.sectionTitle}>Recent Badges</h4>
        <div className={styles.badgesGrid}>
          {badges.map(b => (
            <div key={b.title} className={styles.badge} style={{ background: b.color }}>
              <span className={styles.badgeIcon}>{b.icon}</span>
              <span className={styles.badgeTitle}>{b.title}</span>
            </div>
          ))}
        </div>
      </div>

      <button className={styles.viewFullBtn}>View Full Passport →</button>
    </div>
  );
}
