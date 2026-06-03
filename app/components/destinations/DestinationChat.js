'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './DestinationChat.module.css';

export default function DestinationChat({ wizardData, recommendations = [] }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Com base no teu perfil de viajante, encontrei estes destinos fantásticos. Tens alguma dúvida sobre eles ou gostarias de refinar a tua pesquisa (ex: clima, preço, voos)?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([
    'Qual destes é o mais barato?',
    'Qual é o melhor com crianças?',
    'Dá-me opções com praias.',
    'Qual tem voos mais rápidos?'
  ]);
  
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    const userMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const updatedHistory = [...messages, userMessage];

    try {
      // Build context destination context string for the AI
      const destContext = recommendations.length > 0
        ? `Recomendações do utilizador: ${recommendations.map(r => `${r.name} (${r.country})`).join(', ')}. Perfil do utilizador: ${JSON.stringify(wizardData)}`
        : 'Recomendações de destinos';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory,
          locale: 'pt',
          destination: destContext
        })
      });

      if (!response.ok) throw new Error('Failed to fetch response');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';
      
      // Add empty assistant bubble that we will stream text into
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      setIsTyping(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);
            const text = parsed.text || '';
            aiContent += text;
            
            // Update the last message in state
            setMessages(prev => {
              const copy = [...prev];
              copy[copy.length - 1].content = aiContent;
              return copy;
            });
          } catch (e) {
            // Ignore parse errors for text deltas
          }
        }
      }

      // After streaming is done, look for suggestion chips if returned by API
      // Format expected: SUGGESTIONS: chip1 | chip2 | chip3
      const suggestionsIndex = aiContent.indexOf('SUGGESTIONS:');
      if (suggestionsIndex !== -1) {
        const suggestionsPart = aiContent.slice(suggestionsIndex + 12).trim();
        const cleanedText = aiContent.slice(0, suggestionsIndex).trim();
        
        // Clean up the assistant message to not show the raw SUGGESTIONS string
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1].content = cleanedText;
          return copy;
        });

        // Split the chips
        const chips = suggestionsPart
          .split('|')
          .map(chip => chip.replace(/[\[\]]/g, '').trim())
          .filter(chip => chip.length > 0);

        if (chips.length > 0) {
          setSuggestions(chips);
        }
      } else {
        // Default follow-ups if AI didn't provide suggestions
        setSuggestions([
          'Qual é o clima em cada um?',
          'Quantos dias recomendas?',
          'Explicar custos de alojamento.'
        ]);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Desculpa, ocorreu um erro ao contactar o concierge. Tenta novamente.' }
      ]);
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleSendMessage(input);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>💬</div>
        <h2 className={styles.sectionTitle}>Refinar Pesquisa com AI</h2>
      </div>

      <div className={styles.chatContainer}>
        {/* Messages */}
        <div className={styles.messages}>
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`${styles.message} ${isUser ? styles.messageUser : ''}`}
              >
                <div
                  className={`${styles.avatar} ${
                    isUser ? styles.avatarUser : styles.avatarAi
                  }`}
                >
                  {isUser ? '👤' : '✦'}
                </div>
                <div
                  className={`${styles.bubble} ${
                    isUser ? styles.bubbleUser : styles.bubbleAi
                  }`}
                >
                  <div className={styles.messageContent}>{msg.content}</div>
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className={styles.message}>
              <div className={`${styles.avatar} ${styles.avatarAi}`}>✦</div>
              <div className={styles.typing}>
                <div className={styles.typingDot}></div>
                <div className={styles.typingDot}></div>
                <div className={styles.typingDot}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer input and chips */}
        <div className={styles.footer}>
          {suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  className={styles.chip}
                  onClick={() => handleSendMessage(sug)}
                  disabled={isTyping}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className={styles.inputRow}>
            <input
              type="text"
              className={styles.input}
              placeholder="Pergunta algo sobre estes destinos..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={isTyping || !input.trim()}
              aria-label="Enviar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
