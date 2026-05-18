'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './AiAssistant.module.css';

const Icon = ({ name }) => {
  if (name === 'send') return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M16 2L8 10M16 2L11 16L8 10M16 2L2 7L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (name === 'terminal') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>;
  if (name === 'user') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  return null;
};

export default function AiAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "SYSTEM INITIALIZED. I am Andor Orchestrator. Provide mission parameters or destination targets." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          tripContext: null,
        }),
      });

      if (!response.ok) throw new Error('Chat error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2));
              assistantMessage += text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantMessage };
                return updated;
              });
            } catch {
              // skip non-text lines
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'ERR // CONNECTION TIMEOUT. API KEY NOT FOUND OR SERVER OFFLINE.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section className={styles.assistant} id="assistant">
      <div className={styles.header}>
        <span className="section-label" style={{ color: '#00ffc8', background: 'rgba(0,255,200,0.1)' }}>SYS // ORCHESTRATOR</span>
        <h2 className="section-title" style={{ color: '#fff' }}>Autonomous Intelligence</h2>
        <p className="section-subtitle mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Provide parameters. The Orchestrator will calculate vectors, extract intel, and formulate a mission plan.
        </p>
      </div>

      <div className={styles.chatContainer} ref={chatRef}>
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.chatAvatar}>
              <Icon name="terminal" />
            </div>
            <div className={styles.chatHeaderInfo}>
              <div className={styles.chatName}>ANDOR.SYS</div>
              <div className={styles.chatStatus}>
                <span className={styles.chatStatusDot}></span>
                ACTIVE
              </div>
            </div>
          </div>

          <div className={styles.chatMessages}>
            {messages.map((msg, i) => (
              <div key={i} className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAi}`}>
                <div className={`${styles.messageAvatar} ${msg.role === 'assistant' ? styles.messageAvatarAi : styles.messageAvatarUser}`}>
                  {msg.role === 'assistant' ? <Icon name="terminal" /> : <Icon name="user" />}
                </div>
                <div className={styles.messageContent}>
                  <div className={`${styles.messageBubble} ${msg.role === 'assistant' ? styles.messageBubbleAi : styles.messageBubbleUser}`}>
                    {msg.content || '...'}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className={styles.message}>
                <div className={`${styles.messageAvatar} ${styles.messageAvatarAi}`}><Icon name="terminal" /></div>
                <div className={styles.typing}>
                  <span className={styles.typingDot}></span>
                  <span className={styles.typingDot}></span>
                  <span className={styles.typingDot}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.chatFooter}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.chatInput}
                placeholder="ENTER PROMPT..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                spellCheck="false"
              />
              <button className={styles.chatSend} onClick={handleSend} disabled={isLoading}>
                <Icon name="send" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
