'use client';
import { useState } from 'react';
import styles from './HomeTrending.module.css';
import { destinationsData } from '../../lib/destinations';

export default function HomeTrending({ onOpenWizard }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const userMsg = { role: 'user', content: searchTerm };
    setMessages([userMsg]);
    setSearchTerm('');
    setIsTyping(true);
    
    try {
      const res = await fetch('/api/search-destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg.content })
      });
      
      const data = await res.json();
      
      setIsTyping(false);
      
      if (data.destinations && data.destinations.length > 0) {
        setMessages([
          userMsg,
          { 
            role: 'ai', 
            content: `Aqui estão as sugestões que encontrei para ti baseadas no teu pedido: "${userMsg.content}"!`,
            destinations: data.destinations
          }
        ]);
      } else {
        setMessages([
          userMsg,
          { role: 'ai', content: `Não consegui gerar destinos para este pedido neste momento. Tenta ser mais específico!` }
        ]);
      }
    } catch (err) {
      setIsTyping(false);
      setMessages([
        userMsg,
        { role: 'ai', content: `Houve um erro de ligação à nossa inteligência artificial. Tenta novamente mais tarde!` }
      ]);
    }
  };

  return (
    <section className="section" style={{ backgroundColor: 'var(--bg-1)' }}>
      <div className="container">
        <div className="text-center animate-fade-in-up">
          <h2 className="section-title" style={{ color: 'var(--text-primary)' }}>Aqui encontras o destino ideal para a tua viagem.</h2>
          <p className="section-subtitle mx-auto" style={{ color: 'var(--text-secondary)' }}></p>
          
          <form onSubmit={handleSearch} style={{ marginTop: '2rem', marginBottom: '3rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '600px', display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Descreve a viagem que procuras e encontra os melhores destinos!" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  borderRadius: '100px',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  outline: 'none',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease'
                }}
              />
              <button 
                type="submit"
                disabled={isTyping}
                style={{
                  padding: '0 24px',
                  borderRadius: '100px',
                  background: 'var(--brand-primary)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: isTyping ? 'not-allowed' : 'pointer',
                  opacity: isTyping ? 0.7 : 1
                }}
              >
                {isTyping ? 'A enviar...' : 'Pesquisar'}
              </button>
            </div>
          </form>
        </div>

        {messages.length === 0 && !isTyping && (
          <div className={styles.grid}>
            {destinationsData.slice(0, 12).map((dest, i) => (
              <article key={`${dest.name}-${dest.country}`} className={`${styles.card} card-interactive`} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className={styles.imgWrapper}>
                  <img src={dest.img} alt={`${dest.name}, ${dest.country}`} width="600" height="800" loading="lazy" decoding="async" />
                  <div className={styles.scoreBadge} aria-label={`Andor Score ${dest.score} de 100`}>
                    <span>{dest.score}</span>
                    <small>/100</small>
                  </div>
                  <div className={styles.seasonBadge}>{dest.badge}</div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.tags}>
                    {dest.tags.map(tag => <span key={tag} className={styles.tag}>{tag}</span>)}
                  </div>
                  <h3 className={styles.cardTitle}>{dest.name}</h3>
                  <p className={styles.cardMeta}>{dest.country} · A partir de {dest.price}</p>
                  <button
                    className={`btn btn-secondary ${styles.exploreBtn}`}
                    onClick={() => onOpenWizard && onOpenWizard(dest.name, 2)}
                  >
                    <span>Explorar</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {messages.map((msg, index) => (
            <div key={index} style={{ 
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? '#3b82f6' : 'var(--bg-elevated)',
              color: msg.role === 'user' ? '#ffffff' : 'var(--text-primary)',
              padding: '20px',
              borderRadius: msg.role === 'user' ? '20px 20px 0 20px' : '20px 20px 20px 0',
              maxWidth: '90%',
              boxShadow: 'var(--shadow-md)',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: msg.role === 'ai' ? 'bold' : 'normal', marginBottom: msg.destinations ? '20px' : '0' }}>
                {msg.role === 'ai' ? '✨ Andor AI: ' : ''}{msg.content}
              </p>
              
              {msg.destinations && (
                <div className={styles.grid}>
                  {msg.destinations.map((dest, i) => (
                    <article key={`res-${dest.name}-${i}`} className={`${styles.card} card-interactive`} style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className={styles.imgWrapper}>
                        <img src={dest.img} alt={`${dest.name}, ${dest.country}`} width="600" height="800" loading="lazy" decoding="async" />
                        <div className={styles.scoreBadge}>
                          <span>{dest.score}</span><small>/100</small>
                        </div>
                        <div className={styles.seasonBadge}>{dest.badge}</div>
                      </div>
                      <div className={styles.cardBody}>
                        <div className={styles.tags}>
                          {dest.tags.map(tag => <span key={tag} className={styles.tag}>{tag}</span>)}
                        </div>
                        <h3 className={styles.cardTitle}>{dest.name}</h3>
                        <p className={styles.cardMeta}>{dest.country} · {dest.price}</p>
                        <button className={`btn btn-secondary ${styles.exploreBtn}`} onClick={() => onOpenWizard && onOpenWizard(dest.name, 2)}>
                          <span>Explorar</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div style={{ 
              alignSelf: 'flex-start',
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              padding: '20px',
              borderRadius: '20px 20px 20px 0',
              boxShadow: 'var(--shadow-md)',
              animation: 'fadeIn 0.3s ease-out',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>✨ Andor AI a pesquisar na internet milhares de destinos em tempo real</span>
              <span className={styles.typingDot}>.</span><span className={styles.typingDot}>.</span><span className={styles.typingDot}>.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
