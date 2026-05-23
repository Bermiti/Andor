'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './FloatingAi.module.css';
import { safeParse } from '../lib/safe-json';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './ToastProvider';

// Converter from ANDOR rich JSON format to Legacy format for itinerary pages
function convertAndorToLegacy(andor) {
  if (!andor) return null;
  if (andor.tripOverview && andor.days?.[0]?.stops) {
    return andor;
  }
  
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

// Play cinematic synth sound using Web Audio API
function playCinematicSound() {
  if (typeof window === 'undefined') return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  
  try {
    const ctx = new AudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    
    osc1.frequency.setValueAtTime(110, ctx.currentTime); 
    osc1.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 3);
    
    osc2.frequency.setValueAtTime(165, ctx.currentTime); 
    osc2.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 3);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 2.5);
    filter.Q.setValueAtTime(5, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.5);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    
    osc1.stop(ctx.currentTime + 5);
    osc2.stop(ctx.currentTime + 5);
  } catch (err) {
    // Audio load fail handler
  }
}

// Sub-component for typewriter streaming effect
function TypewriterText({ text, isStreaming }) {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);
  
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(text);
      indexRef.current = text.length;
      return;
    }
    
    let timeoutId;
    const tick = () => {
      if (indexRef.current < text.length) {
        const catchUpChars = Math.max(1, Math.floor((text.length - indexRef.current) / 3));
        indexRef.current += catchUpChars;
        setDisplayedText(text.slice(0, indexRef.current));
        timeoutId = setTimeout(tick, 10 + Math.random() * 15);
      } else {
        timeoutId = setTimeout(tick, 40);
      }
    };
    
    tick();
    return () => clearTimeout(timeoutId);
  }, [text, isStreaming]);

  const cleanText = formatMarkdown(displayedText);
  return (
    <div style={{ display: 'inline' }}>
      <span dangerouslySetInnerHTML={{ __html: cleanText }} />
      {isStreaming && <span className={styles.streamingCursor}>|</span>}
    </div>
  );
}

// Basic markdown formatter that strips tags
function formatMarkdown(text) {
  if (!text) return '';
  
  let cleanText = text
    .replace(/\[ACTION:[^\]]+\]/g, '')
    .replace(/\{[\s\S]*?"destination"[\s\S]*?\}/g, '')
    .replace(/\[HOTEL:[^\]]+\]/g, '')
    .replace(/\[RESTAURANT:[^\]]+\]/g, '')
    .replace(/\[FLIGHT:[^\]]+\]/g, '');
  
  cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  cleanText = cleanText.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
  cleanText = cleanText.replace(/\n/g, '<br/>');
  
  return cleanText;
}

export default function FloatingAi() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useLanguage();
  const { showToast: showGlobalToast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Custom states
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isTherapyMode, setIsTherapyMode] = useState(false);
  const [collabActive, setCollabActive] = useState(false);
  const [collabPartnerTyping, setCollabPartnerTyping] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [showNewChatConfirm, setShowNewChatConfirm] = useState(false);
  
  // Surprise Me Mode States
  const [surpriseWizard, setSurpriseWizard] = useState(false);
  const [surpriseOrigin, setSurpriseOrigin] = useState('');
  const [surpriseBudget, setSurpriseBudget] = useState('');
  const [surpriseDate, setSurpriseDate] = useState('Junho 2026');
  const [surpriseReveal, setSurpriseReveal] = useState(false);
  const [surpriseData, setSurpriseData] = useState(null);
  
  const messagesEndRef = useRef(null);
  const textInputRef = useRef(null);

  const taglines = [
    "Your personal travel concierge",
    "Expert in 195 countries",
    "Planning your perfect journey"
  ];

  const placeholders = [
    "Para onde queres ir?",
    "Que tipo de viagem sonhas?",
    "Qual é o teu orçamento?",
    "Tens alguma restrição alimentar?"
  ];

  // Rotate taglines & placeholders
  useEffect(() => {
    const tagInterval = setInterval(() => {
      setTaglineIdx(prev => (prev + 1) % taglines.length);
    }, 4000);
    const placeInterval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % placeholders.length);
    }, 5000);
    return () => {
      clearInterval(tagInterval);
      clearInterval(placeInterval);
    };
  }, []);

  // Onboarding text by time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bom dia. Ainda a planear a próxima aventura?";
    if (hour >= 12 && hour < 18) return "Boa tarde. Para onde te leva a imaginação hoje?";
    return "Boa noite. Os melhores itinerários nascem a esta hora.";
  };

  const getLastDestination = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const content = messages[i].content;
      if (content.includes('{') && content.includes('}')) {
        try {
          const parsed = safeParse(content.match(/\{[\s\S]*?\}/)[0], null);
          if (parsed?.destination?.city) return parsed.destination.city;
        } catch {}
      }
      if (content.toLowerCase().includes('tóquio') || content.toLowerCase().includes('tokyo')) return 'Tóquio';
      if (content.toLowerCase().includes('lisboa') || content.toLowerCase().includes('lisbon')) return 'Lisboa';
      if (content.toLowerCase().includes('paris')) return 'Paris';
      if (content.toLowerCase().includes('roma') || content.toLowerCase().includes('rome')) return 'Roma';
    }
    return 'Tóquio';
  };

  // Load localStorage history
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('andor_concierge_messages');
      if (stored) {
        try {
          const parsed = safeParse(stored, []);
          if (parsed && parsed.length > 0) {
            setMessages(parsed);
            setUnreadCount(1);
            setHasUnread(true);
            setShowRestorePrompt(true);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Save history helper
  const saveMessages = (newMsgs) => {
    setMessages(newMsgs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('andor_concierge_messages', JSON.stringify(newMsgs.slice(-20)));
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      setUnreadCount(0);
    }
  }, [messages, isOpen, collabPartnerTyping]);

  // Contextual initial suggestions based on active page
  useEffect(() => {
    if (!isOpen || messages.length > 0) return;
    
    // Auto-inject initial greeting or dynamic context alert
    if (pathname.includes('/itinerary/')) {
      showToast('🗺️ Andor: Detetei que estás a visualizar um itinerário. Queres que o melhore?');
    } else if (pathname === '/') {
      showToast('✨ Andor: Bem-vindo à homepage! Não sabes para onde ir? Deixa-me surpreender-te.');
    }
  }, [isOpen, pathname]);

  // Direct actions trigger checking
  const checkAndExecuteActions = (text) => {
    if (!text) return;
    
    // 1. [ACTION:open_map:lat,lng]
    const mapMatch = text.match(/\[ACTION:open_map:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\]/);
    if (mapMatch) {
      const lat = parseFloat(mapMatch[1]);
      const lng = parseFloat(mapMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        window.dispatchEvent(new CustomEvent('andor-open-map', { detail: { lat, lng } }));
        showToast('📍 A centrar o mapa na localização...');
      }
    }

    // 2. [ACTION:save_itinerary]
    if (text.includes('[ACTION:save_itinerary]')) {
      const jsonMatch = text.match(/\{[\s\S]*?"destination"[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const andorItinerary = safeParse(jsonMatch[0], null);
          if (andorItinerary) {
            const legacy = convertAndorToLegacy(andorItinerary);
            const savedTrips = safeParse(localStorage.getItem('andor_saved_trips'), []);
            savedTrips.push(legacy);
            localStorage.setItem('andor_saved_trips', JSON.stringify(savedTrips));
            showToast('💾 Itinerário guardado nos teus favoritos!');
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    // 3. [ACTION:add_favorites:slug]
    const favMatch = text.match(/\[ACTION:add_favorites:([^\]]+)\]/);
    if (favMatch) {
      const slug = favMatch[1];
      const favs = safeParse(localStorage.getItem('andor_favorites'), []);
      if (!favs.includes(slug)) {
        favs.push(slug);
        localStorage.setItem('andor_favorites', JSON.stringify(favs));
      }
      showToast(`⭐ Adicionado aos favoritos: ${slug}`);
    }

    // 4. [ACTION:compare_destinations]
    if (text.includes('[ACTION:compare_destinations]')) {
      showToast('⚖️ A abrir o comparador de destinos...');
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4500);
  };

  const handleSend = async (userText = null) => {
    const textToSend = userText || input.trim();
    if (!textToSend || isLoading) return;

    if (!userText) {
      setInput('');
    }

    const userMessage = { role: 'user', content: textToSend, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMessage];
    saveMessages(newMessages);
    setIsLoading(true);

    setTimeout(scrollToBottom, 50);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          locale,
        }),
      });

      if (!response.ok) throw new Error('Chat API returned error');

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
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
            if (line.startsWith('0:')) {
            try {
              const text = safeParse(line.slice(2), '');
              assistantMessage += text;
              setMessages(prev => {
                const updated = [...prev];
                updated[targetMsgIndex] = { role: 'assistant', content: assistantMessage, isStreaming: true };
                return updated;
              });
            } catch { /* skip */ }
          }
        }
      }

      if (buffer.startsWith('0:')) {
        try {
          const text = safeParse(buffer.slice(2), '');
          assistantMessage += text;
        } catch {}
      }

      setMessages(prev => {
        const updated = [...prev];
        updated[targetMsgIndex] = { role: 'assistant', content: assistantMessage, isStreaming: false };
        if (typeof window !== 'undefined') {
          localStorage.setItem('andor_concierge_messages', JSON.stringify(updated.slice(-20)));
        }
        return updated;
      });

      checkAndExecuteActions(assistantMessage);

    } catch (error) {
      console.error(error);
      saveMessages([...newMessages, { role: 'assistant', content: '⚠️ Ocorreu um erro no servidor. Verifica a tua ligação.', isStreaming: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Safe ref handling for event listener references
  const handleSendRef = useRef(handleSend);
  useEffect(() => {
    handleSendRef.current = handleSend;
  });

  useEffect(() => {
    const handleSearchTrigger = (e) => {
      const { destination, dateArrival, dateDeparture, adults, children } = e.detail;
      setIsOpen(true);
      
      let promptText = `Planeia uma viagem para ${destination}`;
      if (dateArrival && dateDeparture) {
        promptText += ` de ${dateArrival} a ${dateDeparture}`;
      }
      promptText += ` para ${adults} adulto${adults > 1 ? 's' : ''}`;
      if (children > 0) {
        promptText += ` e ${children} criança${children > 1 ? 's' : ''}`;
      }
      promptText += '.';
      
      // Execute stream generation immediately
      handleSendRef.current(promptText);
    };

    const handleOpenAiChat = () => {
      setIsOpen(true);
    };

    window.addEventListener('andor-search-trigger', handleSearchTrigger);
    window.addEventListener('open-ai-chat', handleOpenAiChat);
    
    return () => {
      window.removeEventListener('andor-search-trigger', handleSearchTrigger);
      window.removeEventListener('open-ai-chat', handleOpenAiChat);
    };
  }, []);

  const handleChipClick = (chipText) => {
    if (chipText.includes("Surpreende-me")) {
      setSurpriseWizard(true);
    } else if (chipText.includes("Planeia uma viagem")) {
      handleSend("Planeia uma viagem incrível de 3 dias para mim. Escolhe um destino europeu fascinante e cria o itinerário completo.");
    } else if (chipText.includes("Melhora o meu itinerário")) {
      const pageInfo = pathname.includes('/itinerary/') ? ` que estou a ver (${pathname.split('/').pop()})` : '';
      handleSend(`Ajuda-me a melhorar o meu itinerário actual${pageInfo}. Sugere hacks locais e experiências fora da rota turística.`);
    } else if (chipText.includes("hotel perfeito")) {
      handleSend("Recomenda-me um hotel verdadeiramente excecional, boutique ou luxo, que não seja apenas famoso no Instagram mas que valha a pena.");
    } else if (chipText.includes("emergência de viagem")) {
      handleSend("Estou com uma emergência de viagem (perdi um voo / mala perdida). O que devo fazer passo a passo agora?");
    } else {
      setInput(chipText);
      textInputRef.current?.focus();
    }
  };

  const handleSurpriseReveal = () => {
    if (!surpriseOrigin.trim()) {
      showGlobalToast("Por favor, diz-nos de onde vais partir!", "info");
      return;
    }
    setSurpriseReveal(true);
    playCinematicSound();
    
    const destinations = [
      {
        city: "Tromsø",
        country: "Noruega",
        score: 95,
        priceRange: "€800 - €1,100",
        why: "O sol da meia-noite pinta os fiordes de dourado, e a energia ártica está no seu pico. Ideal para fugir ao calor urbano e experimentar os fiordes sem enchentes.",
        coordinates: [69.6492, 18.9553]
      },
      {
        city: "San Sebastián",
        country: "Espanha",
        score: 92,
        priceRange: "€600 - €900",
        why: "A capital da gastronomia basca oferece praias divinais e tabernas de pintxos inacreditáveis. Ótima época pré-verão com temperaturas perfeitas.",
        coordinates: [43.3183, -1.9812]
      },
      {
        city: "Garmisch-Partenkirchen",
        country: "Alemanha",
        score: 89,
        priceRange: "€500 - €800",
        why: "Os lagos alpinos espelham as montanhas da Baviera. Perfeito para trilhos na Zugspitze e chalés rústicos a preços económicos nesta época.",
        coordinates: [47.4921, 11.0958]
      }
    ];

    const chosen = destinations[Math.floor(Math.random() * destinations.length)];
    
    setTimeout(() => {
      setSurpriseData(chosen);
    }, 4000);
  };

  const confirmSurpriseDestination = () => {
    const dest = `${surpriseData.city}, ${surpriseData.country}`;
    setSurpriseWizard(false);
    setSurpriseReveal(false);
    setSurpriseData(null);
    handleSend(`Cria o teu itinerário completo ANDOR de 4 dias para ${dest}, partindo de ${surpriseOrigin}. Orçamento: ${surpriseBudget || 'Modesto'}€. Rápido e poético.`);
  };

  const handleNewConversation = () => {
    setShowNewChatConfirm(true);
  };

  const confirmNewChat = () => {
    setMessages([]);
    setIsTherapyMode(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('andor_concierge_messages');
    }
    setShowNewChatConfirm(false);
    showToast('🧹 Nova conversa iniciada.');
  };

  const startCollaboration = () => {
    setCollabActive(true);
    navigator.clipboard.writeText(window.location.origin + '?collab=room-andor-collab-' + Math.floor(Math.random() * 10000));
    showToast('🔗 Link de colaboração copiado! Envia-o a um amigo.');

    setTimeout(() => {
      showToast('👥 João juntou-se ao planeamento.');
      
      setTimeout(() => {
        setCollabPartnerTyping(true);
        
        setTimeout(() => {
          setCollabPartnerTyping(false);
          const joaoMessage = {
            role: 'user',
            senderName: 'João',
            content: 'Adorei as sugestões de hotéis! Podíamos tentar incluir uma experiência gastronómica local na segunda noite?',
            timestamp: new Date().toISOString()
          };
          setMessages(prev => {
            const updated = [...prev, joaoMessage];
            if (typeof window !== 'undefined') {
              localStorage.setItem('andor_concierge_messages', JSON.stringify(updated.slice(-20)));
            }
            return updated;
          });
          
          setIsLoading(true);
          setTimeout(async () => {
            try {
              const currentMsgs = [...messages, joaoMessage];
              const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  messages: currentMsgs.map(m => ({ role: m.role, content: m.content })),
                  locale,
                }),
              });
              
              if (response.ok) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let assistantMsg = '';
                
                setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }]);
                
                let buffer = '';
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  
                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');
                  buffer = lines.pop() || '';
                  
                  for (const line of lines) {
                    if (line.startsWith('0:')) {
                          const text = safeParse(line.slice(2), '');
                          assistantMsg += text;
                          setMessages(prev => {
                            const updated = [...prev];
                            updated[updated.length - 1] = { role: 'assistant', content: assistantMsg, isStreaming: true };
                            return updated;
                          });
                        }
                  }
                }
                
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: assistantMsg, isStreaming: false };
                  localStorage.setItem('andor_concierge_messages', JSON.stringify(updated.slice(-20)));
                  return updated;
                });
              }
            } catch (err) {
              console.error(err);
            } finally {
              setIsLoading(false);
            }
          }, 1200);
          
        }, 3000);
      }, 4000);
    }, 6000);
  };

  // Get contextual suggestion questions based on last message keywords
  const getContextSuggestions = () => {
    if (messages.length === 0) return [];
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'assistant') return [];
    
    const contentLower = lastMsg.content.toLowerCase();
    
    // Check if it generated an itinerary (JSON match or mention)
    if (contentLower.includes('"destination"') || contentLower.includes('itinerário criado') || (contentLower.includes('{') && contentLower.includes('}'))) {
      return ["Adicionar dia extra", "Versão mais barata", "Foco em gastronomia"];
    }
    
    if (contentLower.includes('tokyo') || contentLower.includes('tóquio') || contentLower.includes('japan') || contentLower.includes('japão')) {
      return ["E Kyoto?", "Melhor época?", "Orçamento €800?"];
    }

    if (contentLower.includes('hotel') || contentLower.includes('hotéis') || contentLower.includes('hospedagem') || contentLower.includes('alojamento') || contentLower.includes('[hotel:')) {
      return ["Ver mais opções", "Só boutique hotels", "Com pequeno-almoço?"];
    }
    
    if (contentLower.includes('lisbon') || contentLower.includes('lisboa') || contentLower.includes('portugal')) {
      return ["E o Porto?", "Onde comer pastéis de nata?", "Dicas para praias escondidas?"];
    }
    if (contentLower.includes('paris') || contentLower.includes('france') || contentLower.includes('frança')) {
      return ["Onde jantar sem turistas?", "Como evitar filas no Louvre?", "Passeios românticos no Sena?"];
    }
    
    return ["Melhor época para ir?", "Qual o custo médio diário?", "Dicas culturais e etiqueta?"];
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
          setIsOpen(false);
        };

        const handleAdjustItinerary = () => {
          handleSend("Gostaria de fazer alguns ajustes a este itinerário. Podes ajudar-me?");
        };

        return (
          <div className={styles.itineraryCard}>
            <div className={styles.itineraryCardHeader}>
              <span className={styles.itineraryIcon}>✨</span>
              <div>
                <h4 className={styles.itineraryTitle}>Itinerário criado</h4>
                <p className={styles.itinerarySub}>🗾 {city} · {days} dias · €{budgetMin}est</p>
              </div>
            </div>
            <div className={styles.itineraryActions}>
              <button className={styles.itineraryViewBtn} onClick={handleViewItinerary}>
                Ver Itinerário
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

    // 2. Intent detection fallbacks
    // Detect coordinates: e.g. [35.6762, 139.6503] or "lat: 35.6, lng: 139.6"
    let coords = null;
    const arrayMatch = text.match(/\[\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/);
    if (arrayMatch) {
      coords = [parseFloat(arrayMatch[1]), parseFloat(arrayMatch[2])];
    } else {
      const phraseMatch = text.match(/(?:lat|latitude)\s*[:=]?\s*(-?\d+(?:\.\d+)?)\s*,?\s*(?:lng|lon|longitude)\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i);
      if (phraseMatch) {
        coords = [parseFloat(phraseMatch[1]), parseFloat(phraseMatch[2])];
      }
    }

    // Detect flight prices
    let detectedFlight = null;
    const flightKeywords = ['voo', 'voos', 'voar', 'flight', 'flights'];
    const hasFlight = flightKeywords.some(kw => text.toLowerCase().includes(kw));
    const priceMatch = text.match(/(?:€|\$|eur)\s*(\d+)|(\d+)\s*(?:€|\$|eur|euros)/i);
    if (hasFlight && priceMatch && !text.includes('[FLIGHT:')) {
      const priceVal = priceMatch[0];
      const route = "Voo sugerido para a tua viagem";
      detectedFlight = {
        route,
        airline: "Companhia Aérea Sugerida",
        price: priceVal,
        tip: "Preços estimados de ida e volta por pessoa."
      };
    }

    // Detect hotel mentions
    let detectedHotel = null;
    const hotelKeywords = ['hotel', 'hospedagem', 'alojamento', 'resort', 'hostel'];
    const hasHotel = hotelKeywords.some(kw => text.toLowerCase().includes(kw));
    if (hasHotel && !text.includes('[HOTEL:')) {
      const destination = getLastDestination() || "o teu destino";
      detectedHotel = {
        name: "Hotel Boutique Sugerido",
        rating: "4.9",
        price: "Preço estimado sob consulta",
        why: `Localizado no centro de ${destination}, com avaliação excelente dos viajantes.`
      };
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
            marginHeight="0"
            marginWidth="0"
            src={embedUrl}
            style={{ border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px', marginTop: '8px' }}
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

    // 3. Inline cards regex parser
    const parts = text.split(/(\[HOTEL:[^\]]+\]|\[RESTAURANT:[^\]]+\]|\[FLIGHT:[^\]]+\])/g);
    
    return (
      <div className={styles.messageContentBlock}>
        <TypewriterText text={text} isStreaming={msg.isStreaming} />
        
        {parts.map((part, idx) => {
          // Hotel Match
          if (part.startsWith('[HOTEL:')) {
            const inner = part.slice(7, -1).split('|');
            const name = inner[0]?.trim();
            const rating = inner[1]?.trim() || '4.8';
            const price = inner[2]?.trim() || '—';
            const why = inner[3]?.trim() || 'Genuinamente excecional.';
            return (
              <div key={idx} className={styles.inlineCard}>
                <div className={styles.inlineCardHeader}>
                  <span className={styles.cardEmoji}>🏨</span>
                  <div>
                    <h5 className={styles.cardName}>{name}</h5>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardRating}>★ {rating}</span>
                      <span className={styles.cardPrice}>{price}</span>
                    </div>
                  </div>
                </div>
                <p className={styles.cardText}>{why}</p>
              </div>
            );
          }
          
          // Restaurant Match
          if (part.startsWith('[RESTAURANT:')) {
            const inner = part.slice(12, -1).split('|');
            const name = inner[0]?.trim();
            const rating = inner[1]?.trim() || '4.7';
            const price = inner[2]?.trim() || '—';
            const note = inner[3]?.trim() || 'Especialidade local imperdível.';
            return (
              <div key={idx} className={styles.inlineCard}>
                <div className={styles.inlineCardHeader}>
                  <span className={styles.cardEmoji}>🍽️</span>
                  <div>
                    <h5 className={styles.cardName}>{name}</h5>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardRating}>★ {rating}</span>
                      <span className={styles.cardPrice}>{price}</span>
                    </div>
                  </div>
                </div>
                <p className={styles.cardText}>{note}</p>
              </div>
            );
          }
          
          // Flight Match
          if (part.startsWith('[FLIGHT:')) {
            const inner = part.slice(8, -1).split('|');
            const route = inner[0]?.trim() || 'Rota';
            const airline = inner[1]?.trim() || 'Companhia';
            const price = inner[2]?.trim() || '—';
            const tip = inner[3]?.trim() || 'Melhor janela de reserva.';
            return (
              <div key={idx} className={styles.inlineFlightCard}>
                <div className={styles.flightHeader}>
                  <span className={styles.flightBadge}>✈️ Sugestão de Voo</span>
                  <span className={styles.flightPrice}>{price}</span>
                </div>
                <h5 className={styles.flightRoute}>{route}</h5>
                <p className={styles.flightDetails}>{airline} • {tip}</p>
              </div>
            );
          }
          
          return null;
        })}

        {/* Intent-based Widgets */}
        {coords && renderInlineMap(coords[0], coords[1])}

        {detectedFlight && (
          <div className={styles.inlineFlightCard}>
            <div className={styles.flightHeader}>
              <span className={styles.flightBadge}>✈️ Sugestão de Voo</span>
              <span className={styles.flightPrice}>{detectedFlight.price}</span>
            </div>
            <h5 className={styles.flightRoute}>{detectedFlight.route}</h5>
            <p className={styles.flightDetails}>{detectedFlight.airline} • {detectedFlight.tip}</p>
          </div>
        )}

        {detectedHotel && (
          <div className={styles.inlineCard}>
            <div className={styles.inlineCardHeader}>
              <span className={styles.cardEmoji}>🏨</span>
              <div>
                <h5 className={styles.cardName}>{detectedHotel.name}</h5>
                <div className={styles.cardMeta}>
                  <span className={styles.cardRating}>★ {detectedHotel.rating}</span>
                  <span className={styles.cardPrice}>{detectedHotel.price}</span>
                </div>
              </div>
            </div>
            <p className={styles.cardText}>{detectedHotel.why}</p>
          </div>
        )}
      </div>
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyText = (content) => {
    let clean = content
      .replace(/\[ACTION:[^\]]+\]/g, '')
      .replace(/\{[\s\S]*?"destination"[\s\S]*?\}/g, '')
      .replace(/\[HOTEL:[^\]]+\]/g, '')
      .replace(/\[RESTAURANT:[^\]]+\]/g, '')
      .replace(/\[FLIGHT:[^\]]+\]/g, '');
    navigator.clipboard.writeText(clean.trim());
    showToast('📋 Copiado para a área de transferência!');
  };

  const handleInputResize = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className={`${styles.container} ${isOpen ? styles.drawerOpen : ''}`}>
      
      {/* Floating Global Button "Ask Andor" */}
      <button 
        className={`${styles.toggle} ${isOpen ? styles.toggleOpen : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Ask Andor Concierge"
      >
        <div className={styles.particleWrapper}>
          <div className={styles.particleRing1}></div>
          <div className={styles.particleRing2}></div>
        </div>
        
        <span className={styles.toggleIcon}>{isOpen ? '✕' : '✨'}</span>
        
        {hasUnread && (
          <span className={styles.unreadBadge}>{unreadCount}</span>
        )}
        
        <span className={styles.tooltip}>Fala com o teu concierge pessoal</span>
      </button>

      {/* Slide-in Chat Panel */}
      <div className={`${styles.chatWindow} ${isTherapyMode ? styles.therapyTheme : ''}`}>
        
        {/* Grain/Noise Overlay */}
        <div className={styles.grainOverlay}></div>
        
        {/* Header */}
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderLeft}>
            <div className={styles.logoMark}>A</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className={styles.chatHeaderTitle}>ANDOR AI</h2>
                {messages.length > 0 && (
                  <span className={styles.contextSavedBadge} title="Histórico de mensagens guardado localmente">
                    💭 Contexto guardado
                  </span>
                )}
              </div>
              <p className={styles.chatHeaderSubtitle}>{taglines[taglineIdx]}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={`${styles.therapyToggle} ${isTherapyMode ? styles.activeTherapy : ''}`}
              onClick={() => setIsTherapyMode(!isTherapyMode)}
              title="Modo Trip Therapy 🧘"
            >
              🧘
            </button>
            <button 
              className={`${styles.collabBtn} ${collabActive ? styles.activeCollab : ''}`}
              onClick={startCollaboration}
              title="Planear em Grupo 👥"
            >
              👥
            </button>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>✕</button>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className={styles.quickActionsRow}>
          <button onClick={() => handleSend("Mostra-me o mapa das atividades principais.")} className={styles.quickActionBtn}>🗺️ Ver no mapa</button>
          <button onClick={() => handleSend("Cria um itinerário detalhado para mim.")} className={styles.quickActionBtn}>📋 Criar itinerário</button>
          <button onClick={() => handleSend("Ajuda-me a calcular o orçamento estimado desta viagem.")} className={styles.quickActionBtn}>💰 Calcular orçamento</button>
          <button onClick={() => handleSend("Quais são as melhores opções de voos?")} className={styles.quickActionBtn}>✈️ Pesquisar voos</button>
        </div>

        {/* Restore Prompt Banner */}
        {showRestorePrompt && messages.length > 0 && (
          <div className={styles.restorePromptBanner}>
            <span>💭 Continuamos a planear {getLastDestination()}?</span>
            <div className={styles.restoreBannerActions}>
              <button onClick={() => setShowRestorePrompt(false)} className={styles.restoreYesBtn}>Sim</button>
              <button onClick={() => {
                setMessages([]);
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('andor_concierge_messages');
                }
                setShowRestorePrompt(false);
                showToast('🧹 Nova conversa iniciada.');
              }} className={styles.restoreNoBtn}>Não</button>
            </div>
          </div>
        )}

        {/* Local Memory context warning bar */}
        {messages.length > 0 && (
          <div className={styles.memoryBanner}>
            <span>💭 Lembro-me das tuas preferências</span>
            <button onClick={handleNewConversation} className={styles.newChatBtn}>
              Nova Conversa
            </button>
          </div>
        )}

        {/* Message Area */}
        <div className={styles.messages}>
          
          {/* Onboarding View when empty */}
          {messages.length === 0 && !surpriseWizard && (
            <div className={styles.onboarding}>
              <div className={styles.avatarContainer}>
                <div className={styles.avatarMain}></div>
                <div className={styles.avatarWaves}></div>
              </div>
              <h3 className={styles.onboardingGreeting}>{getGreeting()}</h3>
              <p className={styles.onboardingDesc}>
                Eu sou o ANDOR — o teu concierge de viagens de elite. Desenho itinerários completos, 
                descubro hotéis que valem mesmo a pena, hacks de voos e resolvo emergências em segundos.
              </p>
              
              <div className={styles.suggestionGrid}>
                {[
                  "✈️ Planeia uma viagem para mim",
                  "🗺️ Melhora o meu itinerário actual",
                  "💰 Viagem a Tóquio por €800",
                  "🌍 Surpreende-me com um destino",
                  "🏨 Encontra-me o hotel perfeito",
                  "⚡ Resolvo uma emergência de viagem"
                ].map((chip, idx) => (
                  <button 
                    key={idx} 
                    className={styles.suggestionChip}
                    onClick={() => handleChipClick(chip)}
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Surprise Me Wizard UI */}
          {surpriseWizard && (
            <div className={styles.surpriseWizardContainer}>
              {!surpriseReveal ? (
                <>
                  <h3 className={styles.surpriseTitle}>Modo Surpreende-me 🌍</h3>
                  <p className={styles.surpriseDesc}>
                    Escolhemos o destino ideal para ti sem te revelarmos até estares pronto. 
                    Prepara-te para um reveal cinematográfico!
                  </p>
                  
                  <div className={styles.wizardForm}>
                    <label>De onde vais partir?</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Lisboa, Porto, Madrid..."
                      value={surpriseOrigin}
                      onChange={e => setSurpriseOrigin(e.target.value)}
                    />
                    
                    <label>Orçamento total estimado (€)</label>
                    <input 
                      type="number" 
                      placeholder="Ex: 800"
                      value={surpriseBudget}
                      onChange={e => setSurpriseBudget(e.target.value)}
                    />

                    <label>Quando queres viajar?</label>
                    <select value={surpriseDate} onChange={e => setSurpriseDate(e.target.value)}>
                      <option>Junho 2026</option>
                      <option>Julho/Agosto 2026</option>
                      <option>Outono 2026</option>
                      <option>Inverno 2026</option>
                    </select>

                    <div className={styles.wizardBtns}>
                      <button className={styles.wizardCancel} onClick={() => setSurpriseWizard(false)}>
                        Voltar
                      </button>
                      <button className={styles.wizardSubmit} onClick={handleSurpriseReveal}>
                        Revelar Destino 🚀
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.revealScreen}>
                  {!surpriseData ? (
                    <div className={styles.revealLoading}>
                      <div className={styles.radarGrid}>
                        <div className={styles.radarCircle1}></div>
                        <div className={styles.radarCircle2}></div>
                        <div className={styles.radarLine}></div>
                      </div>
                      <div className={styles.coordinatesText}>
                        <span>COORDS: SCANNING COORDINATES...</span>
                        <span>SCANNING GLOBAL DESTINATIONS...</span>
                      </div>
                      <p className={styles.revealText}>A calcular ligações aéreas e o Andor Score ideal...</p>
                    </div>
                  ) : (
                    <div className={styles.revealResult}>
                      <span className={styles.revealTitle}>A tua próxima aventura começa em...</span>
                      <h2 className={styles.revealDestination}>
                        {surpriseData.city}, {surpriseData.country}
                      </h2>
                      
                      {/* Andor Score Badge */}
                      <div className={styles.revealScoreBadge}>
                        <span>Andor Score</span>
                        <strong>{surpriseData.score}/100</strong>
                      </div>

                      <p className={styles.revealWhy}>"{surpriseData.why}"</p>
                      
                      <div className={styles.revealMiniInfo}>
                        <span>Orçamento estimado: <strong>{surpriseData.priceRange}</strong></span>
                      </div>

                      <div className={styles.revealResultBtns}>
                        <button className={styles.revealAccept} onClick={confirmSurpriseDestination}>
                          Criar Itinerário Completo 📝
                        </button>
                        <button 
                          className={styles.revealDecline} 
                          onClick={() => {
                            setSurpriseData(null);
                            handleSurpriseReveal();
                          }}
                        >
                          Tentar Outro Destino 🎲
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Render Messages */}
          {!surpriseWizard && messages.map((msg, i) => (
            <div 
              key={i} 
              className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAssistant}`}
            >
              {msg.role === 'user' && msg.senderName && (
                <span className={styles.senderLabel}>{msg.senderName}</span>
              )}
              
              <div className={styles.bubble}>
                {msg.role === 'user' ? (
                  <div>{msg.content}</div>
                ) : (
                  renderMessageContent(msg)
                )}

                <button 
                  className={styles.copyBtn} 
                  onClick={() => handleCopyText(msg.content)}
                  title="Copiar mensagem"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {/* Contextual Continue Suggestions */}
          {!surpriseWizard && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !isLoading && (
            <div className={styles.contextSuggestions}>
              {getContextSuggestions().map((sug, idx) => (
                <button 
                  key={idx} 
                  className={styles.contextChip}
                  onClick={() => handleSend(sug)}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Collaborative Typing Indicator */}
          {collabPartnerTyping && (
            <div className={`${styles.message} ${styles.messageUser} ${styles.messageCollabPartner}`}>
              <span className={styles.senderLabel}>João está a escrever...</span>
              <div className={styles.bubble}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          {/* Assistant Loading / Typing state */}
          {isLoading && (
            <div className={`${styles.message} ${styles.messageAssistant}`}>
              <div className={styles.bubble}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Toast Notification Container */}
        {toastMessage && (
          <div className={styles.toastNotification}>
            {toastMessage}
          </div>
        )}

        {/* Input Bar */}
        <div className={styles.inputArea}>
          <div className={styles.textareaWrapper}>
            <textarea
              ref={textInputRef}
              rows="1"
              placeholder={placeholders[placeholderIdx]}
              value={input}
              onChange={handleInputResize}
              onKeyDown={handleKeyDown}
              disabled={isLoading || surpriseWizard}
            />
            {input.length > 300 && (
              <span className={styles.charCounter}>
                {input.length}/1000
              </span>
            )}
          </div>
          
          <button 
            className={styles.sendButton} 
            onClick={() => handleSend()} 
            disabled={isLoading || !input.trim() || surpriseWizard}
            title="Enviar mensagem"
          >
            <svg 
              className={styles.sendIcon} 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>

        {/* Bottom context memory label */}
        <div className={styles.bottomPreferencesLabel}>
          <span>💭 Lembro-me das tuas preferências</span>
        </div>

      </div>

      {/* Custom Confirmation Modal */}
      {showNewChatConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Iniciar nova conversa?</h3>
            <p>Isto irá apagar todo o histórico de planeamento atual. Esta ação é irreversível.</p>
            <div className={styles.modalBtns}>
              <button className={styles.modalCancelBtn} onClick={() => setShowNewChatConfirm(false)}>Cancelar</button>
              <button className={styles.modalConfirmBtn} onClick={confirmNewChat}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
