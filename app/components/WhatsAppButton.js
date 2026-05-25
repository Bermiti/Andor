'use client';
import styles from './WhatsAppButton.module.css';

export default function WhatsAppButton() {
  const message = 'Estou a planear uma viagem com a Andor Travels. Vê isto: https://andor.travels';
  const link = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.whatsappFloat}
      aria-label="Share Andor on WhatsApp"
      title="Share Andor on WhatsApp"
    >
      <div className={styles.pulseRing}></div>
      <svg className={styles.whatsappIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.031 2c-5.514 0-9.99 4.493-9.99 10.011 0 1.908.533 3.69 1.458 5.22L2 22l5.002-1.309c1.474.82 3.16 1.288 4.965 1.288 5.513 0 10.033-4.512 10.033-10.033C22 6.49 17.545 2 12.031 2zm6.09 14.545c-.248.694-1.228 1.272-1.748 1.34-.457.06-1.02.1-1.62-.1-2.923-.42-5.46-2.12-7.14-4.58-.69-.99-1.09-2.22-1.09-3.56 0-1.05.35-1.9.91-2.46.248-.25.547-.37.818-.37.2 0 .37.01.52.02.268.01.408.02.588.42.22.49.74 1.8.8 1.93.07.13.1.29.02.46-.08.16-.16.29-.32.47-.15.18-.33.4-.47.53-.16.15-.33.32-.14.65.37.64.83 1.21 1.37 1.7 1.5 1.35 2.68 1.76 3.03 1.93.35.17.55.14.76-.1.21-.24.91-1.06 1.15-1.42.24-.37.49-.3.82-.18.33.12 2.1 1 2.46 1.18.37.18.61.27.7.43.09.16.09.91-.16 1.6z" />
      </svg>
    </a>
  );
}
