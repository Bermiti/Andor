'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLanguage } from '../../context/LanguageContext';
import styles from './DestinationChat.module.css';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMarkdown(text) {
  if (!text) return '';
  
  let cleanText = text
    .replace(/\[ACTION:[^\]]+\]/g, '')
    .replace(/\{[\s\S]*?"destination"[\s\S]*?\}/g, '')
    .replace(/\[HOTEL:[^\]]+\]/g, '')
    .replace(/\[RESTAURANT:[^\]]+\]/g, '')
    .replace(/\[FLIGHT:[^\]]+\]/g, '');

  cleanText = escapeHtml(cleanText);
  
  cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  cleanText = cleanText.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
  cleanText = cleanText.replace(/\n/g, '<br/>');
  
  return cleanText;
}

export default function DestinationChat({ wizardData = {}, recommendations = [] }) {
  const t = useTranslations('destinations');
  const { locale } = useLanguage();

  const initialWelcome = t('chatWelcome') || 'Com base no teu perfil, selecionei estes destinos para ti. Posso ajudar-te a refinar — pede-me para filtrar, comparar ou explorar qualquer destino em detalhe.';

  const [messages, setMessages] = useState([
    { role: 'assistant', content: initialWelcome }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Initial suggestion chips
  useEffect(() => {
    const getMonthName = () => {
      if (!wizardData || !wizardData.travelMonth || wizardData.travelMonth === 'flexible') return '';
      const monthKeys = {
        january: 'monthJan', february: 'monthFeb', march: 'monthMar',
        april: 'monthApr', may: 'monthMay', june: 'monthJun',
        july: 'monthJul', august: 'monthAug', september: 'monthSep',
        october: 'monthOct', november: 'monthNov', december: 'monthDec'
      };
      return t(monthKeys[wizardData.travelMonth]) || '';
    };

    const monthName = getMonthName();
    const list = [
      t('chatSuggestion1') || 'Só opções na Europa',
      t('chatSuggestion2') || 'Destinos mais baratos',
      t('chatSuggestion3') || 'Faz-me um top 3',
      t('chatSuggestion4') || 'Alternativas mais românticas'
    ];
    if (monthName) {
      list.push(`${t('chatSuggestion5') || 'Bons para'} ${monthName}`);
    } else {
      list.push(t('chatSuggestion5') || 'Só destinos com praia');
    }
    setSuggestions(list.slice(0, 4));
  }, [wizardData, t]);

  const extractSuggestions = (fullText) => {
    const suggestionMatch = String(fullText || '').match(/\n?SUGGESTIONS:\s*(.+)$/m);
    if (!suggestionMatch) return { displayText: fullText, chips: [] };
    const chips = suggestionMatch[1]
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
    return {
      displayText: String(fullText).replace(/\n?SUGGESTIONS:.+$/m, '').trim(),
      chips,
    };
  };

  const handleSend = async (customText = null) => {
    const textToSend = customText || input.trim();
    if (!textToSend || isLoading) return;

    if (!customText) {
      setInput('');
    }

    const userMessage = { role: 'user', content: textToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setSuggestions([]);
    setIsLoading(true);

    try {
      // Build context prompt
      const contextPrompt = `O utilizador respondeu a um questionário de viagem para descobrir destinos.
Perfil do utilizador:
- Cidade de partida: ${wizardData.departureCity || 'Desconhecida'}
- Mês de viagem: ${wizardData.travelMonth || 'Flexível'}
- Duração: ${wizardData.duration || 'Flexível'} dias
- Orçamento: ${wizardData.budget || 'Moderado'} (${wizardData.budgetType || 'total'})
- Estilos de viagem: ${(wizardData.travelStyles || []).join(', ')}
- Preferências climáticas: ${wizardData.climate || 'Indiferente'}
- Voo máximo: ${wizardData.maxFlightHours || 'Qualquer'}h
- Popularidade: ${wizardData.destinationPopularity || 'Equilibrada'}
- Evitar: ${(wizardData.avoid || []).join(', ')}
- Notas extra: ${wizardData.additionalInfo || 'Nenhuma'}

Destinos sugeridos inicialmente:
${recommendations.map(r => `- ${r.name} (${r.country}) - Score: ${r.score}% - Tags: ${(r.tags || []).join(', ')}`).join('\n')}

O utilizador quer agora refinar, comparar ou filtrar estas sugestões. Responde mantendo o papel de um concierge de viagens de luxo. Sê elegante, sofisticado, útil e conciso.`;

      // API request body mapping:
      // Map the messages array but inject context into the first user message
      const apiMessages = [];
      let contextInjected = false;

      for (const m of newMessages) {
        if (m.role === 'user') {
          if (!contextInjected) {
            apiMessages.push({
              role: 'user',
              content: `[CONTEXT]\n${contextPrompt}\n\n[USER QUESTION]\n${m.content}`
            });
            contextInjected = true;
          } else {
            apiMessages.push({ role: 'user', content: m.content });
          }
        } else if (m.role === 'assistant') {
          // Exclude initial welcome message from API history to avoid cluttering context
          if (m.content !== initialWelcome) {
            apiMessages.push({ role: 'assistant', content: m.content });
          }
        }
      }

      // If no user messages (should not happen), just use fallback
      if (apiMessages.length === 0) {
        apiMessages.push({ role: 'user', content: textToSend });
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          locale: locale || 'pt',
        }),
      });

      if (!response.ok) throw new Error('Erro na resposta do chat');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      
      const targetMsgIndex = newMessages.length;
      setMessages([...newMessages, { role: 'assistant', content: '', isStreaming: true }]);

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
          try {
            const { text } = JSON.parse(line.slice(6));
            if (text) {
              assistantMessage += text;
              setMessages(prev => {
                const updated = [...prev];
                updated[targetMsgIndex] = { role: 'assistant', content: assistantMessage, isStreaming: true };
                return updated;
              });
            }
          } catch (e) {}
        }
      }

      if (buffer.startsWith('data: ') && buffer !== 'data: [DONE]') {
        try {
          const { text } = JSON.parse(buffer.slice(6));
          if (text) assistantMessage += text;
        } catch (e) {}
      }

      const parsedResponse = extractSuggestions(assistantMessage);
      setSuggestions(parsedResponse.chips);

      setMessages(prev => {
        const updated = [...prev];
        updated[targetMsgIndex] = { role: 'assistant', content: parsedResponse.displayText, isStreaming: false };
        return updated;
      });

    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: '⚠️ Desculpa, ocorreu um erro ao contactar o concierge. Por favor, tenta novamente.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>✦</div>
        <h3 className={styles.sectionTitle}>{t('chatTitle') || 'Refinar Recomendações'}</h3>
      </div>

      <div className={styles.chatContainer}>
        {/* Messages */}
        <div className={styles.messages}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`${styles.message} ${m.role === 'user' ? styles.messageUser : ''}`}
            >
              <div className={`${styles.avatar} ${m.role === 'user' ? styles.avatarUser : styles.avatarAi}`}>
                {m.role === 'user' ? '👤' : '✦'}
              </div>
              <div className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleAi}`}>
                <div 
                  className={styles.messageContent}
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(m.content) }}
                />
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className={styles.message}>
              <div className={`${styles.avatar} ${styles.avatarAi}`}>✦</div>
              <div className={styles.typing}>
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer with suggestions and input */}
        <div className={styles.footer}>
          {suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.chip}
                  onClick={() => handleSend(suggestion)}
                  disabled={isLoading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className={styles.inputRow}>
            <input
              type="text"
              className={styles.input}
              placeholder={t('chatPlaceholder') || 'Pede para filtrar, comparar ou explorar...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              type="button"
              className={styles.sendBtn}
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
