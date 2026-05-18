import styles from './Concierge.module.css';
import { useState, useEffect, useRef } from 'react';

export default function Concierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Bonjour! I see you are planning a trip to Paris. Did you know it might rain on Tuesday? I can suggest indoor alternatives for the Louvre visit.' }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', text: input }]);
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "Analyzing your preferences... I've found a hidden jazz club in Le Marais that fits your 'Nightlife' interest perfectly. Shall I add it to your Day 2 evening?" 
      }]);
    }, 1000);
  };

  return (
    <div className={`${styles.concierge} ${isOpen ? styles.open : ''}`}>
      {!isOpen ? (
        <button className={styles.launcher} onClick={() => setIsOpen(true)}>
          <div className={styles.pulse}></div>
          <span className={styles.icon}>✨</span>
          <span className={styles.label}>AI Concierge</span>
        </button>
      ) : (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.aiStatus}>
              <div className={styles.statusDot}></div>
              <span>Andor Intelligence</span>
            </div>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
          </div>
          
          <div className={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.message} ${styles[m.role]}`}>
                <div className={styles.bubble}>{m.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className={styles.inputArea}>
            <input 
              type="text" 
              placeholder="Ask Andor anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
