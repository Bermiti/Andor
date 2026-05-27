'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import styles from './AiAssistant.module.css';
import { safeParse } from '../lib/safe-json';

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

function TypewriterText({ text, isStreaming }) {
  const cleanText = formatMarkdown(text);
  return (
    <div style={{ display: 'inline' }}>
      <span dangerouslySetInnerHTML={{ __html: cleanText }} />
      {isStreaming && <span style={{ animation: 'pulse 1s infinite', marginLeft: '2px', fontWeight: 'bold' }}>|</span>}
    </div>
  );
}

// Convert ANDOR JSON itinerary to legacy format (for /itinerary/[id] compatibility)
function convertAndorToLegacy(andor) {
  if (!andor) return null;
  if (andor.tripOverview && andor.days?.[0]?.stops) return andor;
  
  const city = andor.destination?.city || "";
  const country = andor.destination?.country || "";
  const destName = city && country ? `${city}, ${country}` : (city || country || "Custom Destination");
  
  const minBudget = andor.trip?.totalBudgetEstimate?.min || 100;
  const maxBudget = andor.trip?.totalBudgetEstimate?.max || 500;
  const currency = andor.trip?.totalBudgetEstimate?.currency || "EUR";
  
  const legacyDays = (andor.days || []).map((day, idx) => {
    const stops = [];
    
    if (day.meals?.breakfast?.name) {
      stops.push({
        time: day.meals.breakfast.openingTime || "08:30",
        name: day.meals.breakfast.name,
        type: `Breakfast — ${day.meals.breakfast.type || "Local Breakfast"}`,
        isRestaurant: true,
        estimatedCost: `${day.meals.breakfast.cost || 0} ${currency}`,
        localSecret: day.meals.breakfast.insiderNote || "",
        coordinates: day.meals.breakfast.coordinates ? {
          lat: day.meals.breakfast.coordinates[0],
          lng: day.meals.breakfast.coordinates[1]
        } : null
      });
    }
    
    const periods = ['morning', 'afternoon', 'evening'];
    periods.forEach(p => {
      const activities = day.periods?.[p]?.activities || [];
      activities.forEach(act => {
        stops.push({
          time: act.startTime || "10:00",
          name: act.name,
          type: `${act.type || "activity"} — ${act.duration || "2h"} duration`,
          isRestaurant: act.type === 'food',
          estimatedCost: `${act.cost || 0} ${currency}`,
          localSecret: act.insiderTip || "",
          coordinates: act.coordinates ? {
            lat: act.coordinates[0],
            lng: act.coordinates[1]
          } : null
        });
      });
    });
    
    if (day.meals?.lunch?.name) {
      stops.push({
        time: day.meals.lunch.openingTime || "13:00",
        name: day.meals.lunch.name,
        type: `Lunch — ${day.meals.lunch.type || "Local Lunch"}`,
        isRestaurant: true,
        estimatedCost: `${day.meals.lunch.cost || 0} ${currency}`,
        localSecret: day.meals.lunch.insiderNote || "",
        coordinates: day.meals.lunch.coordinates ? {
          lat: day.meals.lunch.coordinates[0],
          lng: day.meals.lunch.coordinates[1]
        } : null
      });
    }
    
    if (day.meals?.dinner?.name) {
      stops.push({
        time: day.meals.dinner.openingTime || "20:00",
        name: day.meals.dinner.name,
        type: `Dinner — ${day.meals.dinner.type || "Local Dinner"}`,
        isRestaurant: true,
        estimatedCost: `${day.meals.dinner.cost || 0} ${currency}`,
        localSecret: day.meals.dinner.insiderNote || "",
        coordinates: day.meals.dinner.coordinates ? {
          lat: day.meals.dinner.coordinates[0],
          lng: day.meals.dinner.coordinates[1]
        } : null
      });
    }
    
    stops.sort((a, b) => a.time.localeCompare(b.time));
    
    return {
      title: day.title || `Day ${day.dayNumber || (idx + 1)}`,
      localSecrets: day.localSecret || day.culturalNote || "",
      stops: stops
    };
  });
  
  return {
    destination: destName,
    title: andor.days?.[0]?.title || `Trip to ${destName}`,
    image: `https://images.unsplash.com/photo-1548705085-101177834f47?q=80&w=1200&auto=format&fit=crop`,
    description: andor.destination?.andorVerdict || `A beautiful custom itinerary for ${destName}.`,
    totalCost: `€${minBudget} - €${maxBudget}`,
    duration: `${andor.trip?.totalDays || legacyDays.length} days`,
    style: andor.trip?.travelStyle || "Luxury",
    travelers: andor.trip?.groupType || "Couple",
    days: legacyDays,
    mustEat: [
      andor.days?.[0]?.meals?.dinner?.name,
      andor.days?.[0]?.meals?.lunch?.name
    ].filter(Boolean),
    contingency: {
      emergencyInfo: `Hospital: ${andor.days?.[0]?.emergencyInfo?.nearestHospital || "Call 112"}, Embassy: ${andor.days?.[0]?.emergencyInfo?.nearestEmbassy || "Contact local consulate"}`,
      unexpectedTips: andor.culturalNote || "Always carry local currency and respect local cultures."
    }
  };
}

export default function AiAssistant() {
  const router = useRouter();
  const { user } = useAuth();
  const { locale } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseSuggestions, setResponseSuggestions] = useState([]);
  
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load message history if exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('andor_destination_chat_history');
      if (stored) {
        try {
          const parsed = safeParse(stored, []);
          if (parsed && parsed.length > 0) {
            setMessages(parsed);
          }
        } catch (e) {}
      }
    }
  }, []);

  const saveMessages = (newMsgs) => {
    setMessages(newMsgs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('andor_destination_chat_history', JSON.stringify(newMsgs.slice(-20)));
    }
  };

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
    setResponseSuggestions([]);
    saveMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          locale: locale || 'pt',
        }),
      });

      if (!response.ok) throw new Error('Erro na resposta do chat');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      
      const targetMsgIndex = newMessages.length;
      saveMessages([...newMessages, { role: 'assistant', content: '', isStreaming: true }]);

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
      setResponseSuggestions(parsedResponse.chips);

      setMessages(prev => {
        const updated = [...prev];
        updated[targetMsgIndex] = { role: 'assistant', content: parsedResponse.displayText, isStreaming: false };
        if (typeof window !== 'undefined') {
          localStorage.setItem('andor_destination_chat_history', JSON.stringify(updated.slice(-20)));
        }
        return updated;
      });

    } catch (err) {
      console.error(err);
      saveMessages([...newMessages, { 
        role: 'assistant', 
        content: '⚠️ Desculpa, ocorreu um erro. Por favor, verifica a tua ligação e tenta novamente.' 
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

  const handleNewConversation = () => {
    setMessages([]);
    setResponseSuggestions([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('andor_destination_chat_history');
    }
  };

  const renderMessageContent = (msg) => {
    const text = msg.content;
    
    // 1. JSON Itinerary Card detection
    const jsonMatch = text.match(/\{[\s\S]*?"destination"[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const andorItinerary = JSON.parse(jsonMatch[0]);
        const city = andorItinerary.destination?.city || "Destino";
        const days = andorItinerary.trip?.totalDays || andorItinerary.days?.length || 3;
        const budgetMin = andorItinerary.trip?.totalBudgetEstimate?.min || 200;

        const handleViewItinerary = () => {
          const legacyFormat = convertAndorToLegacy(andorItinerary);
          const id = 'gen-' + Date.now();
          sessionStorage.setItem(`andor_itinerary_${id}`, JSON.stringify(legacyFormat));
          router.push(`/itinerary/${id}`);
        };

        const handleAdjustItinerary = () => {
          handleSend("Gostaria de fazer alguns ajustes a este itinerário. Podes ajudar-me?");
        };

        return (
          <div className={styles.itineraryCard}>
            <div className={styles.itineraryCardHeader}>
              <span className={styles.itineraryIcon}>✨</span>
              <div>
                <h4 className={styles.itineraryTitle}>Itinerário Criado</h4>
                <p className={styles.itinerarySub}>🗾 {city} · {days} dias · €{budgetMin} est</p>
              </div>
            </div>
            <div className={styles.itineraryActions}>
              <button className={styles.itineraryViewBtn} onClick={handleViewItinerary}>
                Ver Itinerário Completo
              </button>
              <button className={styles.itineraryAdjustBtn} onClick={handleAdjustItinerary}>
                Ajustar
              </button>
            </div>
          </div>
        );
      } catch (e) {
        return <div className={styles.itineraryLoading}>✨ A estruturar o teu Itinerário Completo...</div>;
      }
    }

    // 2. Intent detection fallbacks (coordinates)
    let coords = null;
    const arrayMatch = text.match(/\[\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s+\]/) || text.match(/\[\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/);
    if (arrayMatch) {
      coords = [parseFloat(arrayMatch[1]), parseFloat(arrayMatch[2])];
    }

    const parsedHotels = [];
    const parsedFlights = [];
    const parsedRestaurants = [];

    // Parse hotels inline
    if (text.toLowerCase().includes('hotel') && !text.includes('[HOTEL:')) {
      const matches = text.match(/(?:hotel|hostel|resort)\s+([A-Z][a-zA-Zãõáéíóúçñ\s\-]{3,30})/gi);
      if (matches) {
        matches.forEach(m => {
          const name = m.trim();
          if (!parsedHotels.some(h => h.name.toLowerCase() === name.toLowerCase()) && name.length > 5) {
            parsedHotels.push({
              name,
              rating: "⭐⭐⭐⭐",
              location: "Recomendado",
              price: "~€120/noite",
              desc: "Alojamento selecionado para a tua viagem."
            });
          }
        });
      }
    }

    const renderInlineMap = (lat, lng) => {
      const bbox = `${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}`;
      const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;
      return (
        <div className={styles.inlineMapWrapper}>
          <iframe
            width="100%"
            height="180"
            frameBorder="0"
            scrolling="no"
            src={embedUrl}
            style={{ border: '1px solid rgba(212, 168, 67, 0.3)', borderRadius: '8px', marginTop: '8px' }}
          ></iframe>
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.mapLinkBtn}
          >
            🗺️ Abrir no Google Maps
          </a>
        </div>
      );
    };

    // Inline cards regex parser
    const parts = text.split(/(\[HOTEL:[^\]]+\]|\[RESTAURANT:[^\]]+\]|\[FLIGHT:[^\]]+\])/g);
    
    return (
      <div className={styles.messageContentBlock}>
        <TypewriterText text={text} isStreaming={msg.isStreaming} />
        
        {parts.map((part, idx) => {
          if (part.startsWith('[HOTEL:')) {
            const inner = part.slice(7, -1).split('|');
            const name = inner[0]?.trim();
            const rating = inner[1]?.trim() || '4.8';
            const price = inner[2]?.trim() || '—';
            const why = inner[3]?.trim() || 'Alojamento selecionado.';
            return (
              <div key={idx} className={styles.inlineCard}>
                <div className={styles.inlineCardHeader}>
                  <span className={styles.cardEmoji}>🏨</span>
                  <div style={{ flex: 1 }}>
                    <h5 className={styles.cardName}>{name}</h5>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardRating}>★ {rating}</span>
                      <span className={styles.cardPrice}>{price}</span>
                    </div>
                  </div>
                </div>
                <p className={styles.cardText}>{why}</p>
                <a 
                  href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.cardActionLink}
                >
                  Ver no Booking.com →
                </a>
              </div>
            );
          }
          
          if (part.startsWith('[RESTAURANT:')) {
            const inner = part.slice(12, -1).split('|');
            const name = inner[0]?.trim();
            const rating = inner[1]?.trim() || '4.7';
            const price = inner[2]?.trim() || '—';
            const note = inner[3]?.trim() || 'Especialidade local recomendada.';
            return (
              <div key={idx} className={styles.inlineCard}>
                <div className={styles.inlineCardHeader}>
                  <span className={styles.cardEmoji}>🍽️</span>
                  <div style={{ flex: 1 }}>
                    <h5 className={styles.cardName}>{name}</h5>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardRating}>★ {rating}</span>
                      <span className={styles.cardPrice}>{price}</span>
                    </div>
                  </div>
                </div>
                <p className={styles.cardText}>{note}</p>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.cardActionLink}
                >
                  Ver no Google Maps →
                </a>
              </div>
            );
          }
          
          if (part.startsWith('[FLIGHT:')) {
            const inner = part.slice(8, -1).split('|');
            const route = inner[0]?.trim() || 'Rota';
            const airline = inner[1]?.trim() || 'Companhia';
            const price = inner[2]?.trim() || '—';
            const tip = inner[3]?.trim() || 'Dica de voo.';
            return (
              <div key={idx} className={styles.inlineFlightCard}>
                <div className={styles.flightHeader}>
                  <span className={styles.flightBadge}>✈️ Sugestão de Voo</span>
                  <span className={styles.flightPrice}>{price}</span>
                </div>
                <h5 className={styles.flightRoute}>{route}</h5>
                <p className={styles.flightDetails}>{airline} • {tip}</p>
                <a 
                  href="https://www.skyscanner.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.cardActionLink}
                >
                  Pesquisar no Skyscanner →
                </a>
              </div>
            );
          }
          return null;
        })}

        {coords && renderInlineMap(coords[0], coords[1])}

        {parsedHotels.map((hotel, idx) => (
          <div key={`p-hotel-${idx}`} className={styles.inlineCard}>
            <div className={styles.inlineCardHeader}>
              <span className={styles.cardEmoji}>🏨</span>
              <div style={{ flex: 1 }}>
                <h5 className={styles.cardName}>{hotel.name}</h5>
                <div className={styles.cardMeta}>
                  <span className={styles.cardRating}>{hotel.rating}</span>
                  <span> · {hotel.location} · {hotel.price}</span>
                </div>
              </div>
            </div>
            <p className={styles.cardText}>"{hotel.desc}"</p>
            <a 
              href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name)}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.cardActionLink}
            >
              Ver no Booking.com →
            </a>
          </div>
        ))}
      </div>
    );
  };

  const initialSuggestions = [
    "⛷️ Estâncias de ski na Europa",
    "🍣 Melhores pontos gastronómicos em Tóquio",
    "🏛️ Roteiro cultural de 3 dias em Roma",
    "🏝️ Escapadela de praia em Maiorca"
  ];

  return (
    <section className={styles.assistant} id="assistant">
      <div className={styles.header}>
        <span className="section-label">💬 AI Assistant</span>
        <h2 className="section-title">O teu companheiro de viagem, sempre disponível</h2>
        <p className="section-subtitle mx-auto">
          Conversa naturalmente para planeares a tua próxima aventura. O Andor compreende o contexto, pesquisa na internet e sugere itinerários fantásticos em tempo real.
        </p>
      </div>

      <div className={styles.chatContainer} ref={chatRef}>
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.chatAvatar}>🧭</div>
            <div className={styles.chatHeaderInfo}>
              <div className={styles.chatName}>Assistente Andor</div>
              <div className={styles.chatStatus}>
                <span className={styles.chatStatusDot}></span>
                Online — Com tecnologia IA em tempo real
              </div>
            </div>
            {messages.length > 0 && (
              <button onClick={handleNewConversation} className={styles.contextChip}>
                Nova Conversa
              </button>
            )}
          </div>

          <div className={styles.chatMessages}>
            {messages.length === 0 && (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧭</div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Olá! Como posso ajudar na tua viagem?
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                  Posso sugerir destinos fantásticos, criar roteiros à tua medida, sugerir hotéis e restaurantes locais.
                </p>
                <div className={styles.suggestionGrid} style={{ justifyContent: 'center' }}>
                  {initialSuggestions.map((sug, i) => (
                    <button key={i} onClick={() => handleSend(sug)} className={styles.suggestionChip}>
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : ''}`}>
                <div className={`${styles.messageAvatar} ${msg.role === 'assistant' ? styles.messageAvatarAi : styles.messageAvatarUser}`}>
                  {msg.role === 'assistant' ? '🧭' : '👤'}
                </div>
                <div>
                  <div className={`${styles.messageBubble} ${msg.role === 'assistant' ? styles.messageBubbleAi : styles.messageBubbleUser}`}>
                    {msg.role === 'assistant' ? renderMessageContent(msg) : msg.content}
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
            {responseSuggestions.length > 0 && (
              <div className={styles.contextSuggestions}>
                {responseSuggestions.map((chip, idx) => (
                  <button key={idx} onClick={() => handleSend(chip)} className={styles.contextChip}>
                    {chip}
                  </button>
                ))}
              </div>
            )}
            
            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.chatInput}
                placeholder="Pergunta-me algo... (ex: Mostra-me sítios para fazer ski na Europa)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <button className={styles.chatSend} onClick={() => handleSend()} disabled={isLoading || !input.trim()}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M16 2L8 10M16 2L11 16L8 10M16 2L2 7L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
