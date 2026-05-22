'use client';
import { useEffect, useRef } from 'react';
import styles from './CtaFinal.module.css';

export default function CtaFinal() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    let particles = [];
    const createParticles = () => {
      const w = canvas.width;
      const h = canvas.height;
      particles = Array.from({ length: 30 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.5 + 0.1
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(draw);
    };

    resize();
    createParticles();
    draw();

    const handleResize = () => {
      resize();
      createParticles();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleOpenAuth = () => {
    window.dispatchEvent(new Event('open-auth-modal'));
  };

  const handleOpenConcierge = () => {
    window.dispatchEvent(new Event('open-ai-chat'));
  };

  return (
    <section className={styles.section} id="cta">
      {/* Background Particles Canvas */}
      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>
            A tua próxima aventura está a uma pergunta de distância
          </h2>
          <p className={styles.subtitle}>
            Junta-te a mais de 50.000 viajantes que já descobriram a nova era de planeamento com o Andor.
          </p>

          <div className={styles.buttons}>
            <button 
              type="button" 
              className={styles.primaryBtn}
              onClick={handleOpenAuth}
            >
              Começar Grátis
            </button>
            <button 
              type="button" 
              className={styles.secondaryBtn}
              onClick={handleOpenConcierge}
            >
              Ver Demo ✦
            </button>
          </div>

          <div className={styles.badgesWrapper}>
            <div className={styles.cardsRow}>
              {/* Payment Mock Badges */}
              <span className={styles.cardBadge}>VISA</span>
              <span className={styles.cardBadge}>Mastercard</span>
              <span className={styles.cardBadge}>Apple Pay</span>
              <span className={styles.cardBadge}>Google Pay</span>
              <span className={styles.cardBadge}>AMEX</span>
            </div>
            <p className={styles.noCardText}>Sem cartão de crédito necessário para começar</p>
          </div>
        </div>
      </div>
    </section>
  );
}
