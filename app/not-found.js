'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import styles from './not-found.module.css';

export default function NotFound() {
  useEffect(() => {
    document.title = "404 — Parece que te perdeste · Andor";
  }, []);

  const openAIChat = () => {
    window.dispatchEvent(new Event('open-ai-chat'));
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundImage}></div>
      <div className={styles.content}>
        <div className={styles.compassWrapper}>
          <svg className={styles.compassSvg} viewBox="0 0 24 24">
            {/* Outline compass body */}
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            {/* Compass ticks */}
            <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" />
            <line x1="2" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="20" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
            {/* North text */}
            <text x="12" y="7.5" fontSize="3" fontWeight="bold" textAnchor="middle" fill="currentColor">N</text>
            {/* Needle */}
            <polygon points="12,5.5 14,12 12,10.5" fill="var(--coral, #E8604A)" />
            <polygon points="12,18.5 10,12 12,13.5" fill="currentColor" opacity="0.6" />
            <polygon points="12,5.5 10,12 12,10.5" fill="var(--coral-light, #FF8066)" />
            <polygon points="12,18.5 14,12 12,13.5" fill="currentColor" />
          </svg>
        </div>

        <div className={styles.title} aria-hidden="true">404</div>
        <p className={styles.subtitle}>Acontece até aos melhores exploradores.</p>

        <div className={styles.buttonGroup}>
          <Link href="/" className={styles.primaryBtn}>
            ← Voltar ao início
          </Link>
          <Link href="/?wizard=true" className={styles.secondaryBtn}>
            Descobrir destinos
          </Link>
        </div>

        <button onClick={openAIChat} className={styles.askAndor}>
          Ou pergunta ao Andor →
        </button>
      </div>
    </div>
  );
}
