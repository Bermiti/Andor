'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './AiAssistant.module.css';

const conversation = [
  { role: 'ai', text: "Good morning! 👋 I'm your Andor travel assistant. I see you're exploring Lisbon today. How can I help?" },
  { role: 'user', text: 'Make today more relaxed, I\'m feeling a bit tired.' },
  { role: 'ai', text: "No problem! I've adjusted your itinerary. I've removed the walking tour and replaced it with a scenic tram ride, and extended your lunch by 30 minutes at a cozy café in Chiado. 🍽️", hasUpdate: true, updateText: '✓ Itinerary updated — 2 stops modified' },
  { role: 'user', text: 'Can you add a beach nearby?' },
  { role: 'ai', text: "Great idea! 🏖️ I've added Praia de Carcavelos to your afternoon — it's just a 20-min train ride from Cais do Sodré. I've also pushed dinner 1 hour later so you can enjoy the sunset. Want me to suggest a beachside restaurant?", hasUpdate: true, updateText: '✓ Added beach stop + adjusted schedule' },
];

export default function AiAssistant() {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [showTyping, setShowTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    let i = 0;
    const showNext = () => {
      if (i >= conversation.length) return;
      const currentIndex = i;
      const currentMsg = conversation[currentIndex];
      setShowTyping(true);
      setTimeout(() => {
        setShowTyping(false);
        setVisibleMessages(prev => [...prev, currentMsg]);
        i = currentIndex + 1;
        setTimeout(showNext, 1200);
      }, currentMsg.role === 'ai' ? 1500 : 600);
    };
    showNext();
  }, [started]);

  return (
    <section className={styles.assistant} id="assistant">
      <div className={styles.header}>
        <span className="section-label">💬 AI Assistant</span>
        <h2 className="section-title">Your travel companion, always listening</h2>
        <p className="section-subtitle mx-auto">
          Chat naturally to modify your plans on the fly. Andor understands context and updates your itinerary instantly.
        </p>
      </div>

      <div className={styles.chatContainer} ref={ref}>
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.chatAvatar}>🧭</div>
            <div className={styles.chatHeaderInfo}>
              <div className={styles.chatName}>Andor Assistant</div>
              <div className={styles.chatStatus}>
                <span className={styles.chatStatusDot}></span>
                Online — Lisbon, Portugal
              </div>
            </div>
          </div>

          <div className={styles.chatMessages}>
            {visibleMessages.map((msg, i) => (
              <div key={i} className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : ''}`}>
                <div className={`${styles.messageAvatar} ${msg.role === 'ai' ? styles.messageAvatarAi : styles.messageAvatarUser}`}>
                  {msg.role === 'ai' ? '🧭' : '👤'}
                </div>
                <div>
                  <div className={`${styles.messageBubble} ${msg.role === 'ai' ? styles.messageBubbleAi : styles.messageBubbleUser}`}>
                    {msg.text}
                  </div>
                  {msg.hasUpdate && (
                    <div className={styles.updateCard}>
                      {msg.updateText}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {showTyping && (
              <div className={styles.message}>
                <div className={`${styles.messageAvatar} ${styles.messageAvatarAi}`}>🧭</div>
                <div className={styles.typing}>
                  <span className={styles.typingDot}></span>
                  <span className={styles.typingDot}></span>
                  <span className={styles.typingDot}></span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.chatFooter}>
            <input
              type="text"
              className={styles.chatInput}
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button className={styles.chatSend}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M16 2L8 10M16 2L11 16L8 10M16 2L2 7L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
