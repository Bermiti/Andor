import styles from './loading.module.css';

export default function Loading() {
  return (
    <main className={styles.loadingShell} aria-label="A preparar Andor">
      <div className={styles.loadingCard}>
        <span className={styles.brandMark}>Andor</span>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonLine}></div>
        <div className={styles.skeletonLineShort}></div>
        <div className={styles.skeletonControls}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </main>
  );
}
