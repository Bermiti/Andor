'use client';
import styles from './VisualWall.module.css';

export default function VisualWall({ image, title, subtitle }) {
  return (
    <section className={styles.wall} style={{ backgroundImage: `url(${image})` }}>
      <div className={styles.overlay}></div>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </section>
  );
}
