'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './AiAssistant.module.css';

export default function AiAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Olá! 👋 Sou o teu assistente de viagem Andor. Pergunta-me sobre qualquer destino, monumento, ou pede-me para modificar os teus planos!" }
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

      if (!response.ok) throw new Error('Erro no chat');

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
        content: '⚠️ Desculpa, ocorreu um erro. Verifica se a chave de API do Gemini está no .env.local.' 
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
        <span className="section-label">💬 AI Assistant</span>
        <h2 className="section-title">Your travel companion, always listening</h2>
        <p className="section-subtitle mx-auto">
          Chat naturally to modify your plans on the fly. Andor understands context and updates your itinerary instantly.
        </p>
      </div>

      <div className={styles.chatContainer} ref={chatRef}>
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.chatAvatar}>🧭</div>
            <div className={styles.chatHeaderInfo}>
              <div className={styles.chatName}>Andor Assistant</div>
              <div className={styles.chatStatus}>
                <span className={styles.chatStatusDot}></span>
                Online — Powered by AI
              </div>
            </div>
          </div>

          <div className={styles.chatMessages}>
            {messages.map((msg, i) => (
              <div key={i} className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : ''}`}>
                <div className={`${styles.messageAvatar} ${msg.role === 'assistant' ? styles.messageAvatarAi : styles.messageAvatarUser}`}>
                  {msg.role === 'assistant' ? '🧭' : '👤'}
                </div>
                <div>
                  <div className={`${styles.messageBubble} ${msg.role === 'assistant' ? styles.messageBubbleAi : styles.messageBubbleUser}`}>
                    {msg.content || '...'}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className={styles.message}>
                <div className={`${styles.messageAvatar} ${styles.messageAvatarAi}`}>🧭</div>
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
            <input
              type="text"
              className={styles.chatInput}
              placeholder="Pergunta algo... (ex: Conta-me sobre a Torre de Belém)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button className={styles.chatSend} onClick={handleSend} disabled={isLoading}>
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
