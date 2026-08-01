'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { trackEvent } from '../lib/analytics';
import styles from './FloatingAi.module.css';
import { useChatContext } from '../context/ChatContext';
import { safeParse } from '../lib/safe-json';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './ToastProvider';
import ConfirmDialog from './ConfirmDialog';

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

function TypewriterText({ text, isStreaming }) {
  const cleanText = formatMarkdown(text);
  return (
    <div style={{ display: 'inline' }}>
      <span dangerouslySetInnerHTML={{ __html: cleanText }} />
      {isStreaming && <span className={styles.streamingCursor}>|</span>}
    </div>
  );
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Basic markdown formatter with HTML escaped before lightweight formatting
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

export default function FloatingAi() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useLanguage();
  const { showToast: showGlobalToast } = useToast();
  const { currentPage, currentDestination, currentItinerary } = useChatContext();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentMonthName, setCurrentMonthName] = useState('Outubro');
  
  useEffect(() => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    setCurrentMonthName(months[new Date().getMonth()]);
  }, []);

  const getCurrentDestinationName = () => {
    if (pathname && pathname.startsWith('/destination/')) {
      const slug = pathname.split('/').pop();
      return slug.charAt(0).toUpperCase() + slug.slice(1);
    }
    if (pathname && pathname.includes('/itinerary/')) {
      return getLastDestination() || 'Tóquio';
    }
    return 'Tóquio';
  };
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [responseSuggestions, setResponseSuggestions] = useState([]);
  
  // Custom states
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isTherapyMode, setIsTherapyMode] = useState(false);
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
    "Planeamento transparente, sem reservas fictícias",
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
    if (typeof window !== 'undefined') {
      const storedDestination = localStorage.getItem('andor_last_destination');
      if (storedDestination) return storedDestination;
    }
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

  const inferDestinationFromText = (text) => {
    const value = String(text || '').toLowerCase();
    if (value.includes('tokyo') || value.includes('tóquio')) return 'Tokyo';
    if (value.includes('paris')) return 'Paris';
    if (value.includes('bali')) return 'Bali';
    if (value.includes('lisboa') || value.includes('lisbon')) return 'Lisboa';
    if (value.includes('roma') || value.includes('rome')) return 'Roma';
    return '';
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

  // Load localStorage history
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('andor_chat_history') || localStorage.getItem('andor_concierge_messages');
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
          // silent fail on parse
        }
      }
    }
  }, []);

  // Save history helper
  const saveMessages = (newMsgs) => {
    setMessages(newMsgs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('andor_concierge_messages', JSON.stringify(newMsgs.slice(-20)));
      localStorage.setItem('andor_chat_history', JSON.stringify(newMsgs.slice(-20)));
      const lastDestination = [...newMsgs].reverse().map((message) => inferDestinationFromText(message.content)).find(Boolean);
      if (lastDestination) {
        localStorage.setItem('andor_last_destination', lastDestination);
      }
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
  }, [messages, isOpen]);

  // Contextual initial suggestions based on active page
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      let welcomeContent = '';
      if (pathname && pathname.startsWith('/destination/')) {
        const slug = pathname.split('/').pop();
        const destName = slug.charAt(0).toUpperCase() + slug.slice(1);
        welcomeContent = `Estou a ver que estás a explorar ${destName}...`;
      } else if (pathname && pathname.includes('/itinerary/')) {
        welcomeContent = "Posso melhorar este itinerário, adicionar um dia, ou ajustar o orçamento. O que precisas?";
      } else {
        welcomeContent = `Olá! ${getGreeting()} Eu sou o Andor, o teu concierge AI de elite. Como posso ajudar na tua próxima aventura?`;
      }
      setMessages([{ role: 'assistant', content: welcomeContent, id: `welcome-${Date.now()}` }]);
    }
  }, [isOpen, pathname]);

  useEffect(() => {
    if (isOpen) {
      trackEvent('ai_concierge_opened');
    }
  }, [isOpen]);

  // Direct actions trigger checking
  const checkAndExecuteActions = (text) => {
    if (!text) return;
    
    // 1. [ACTION:save_itinerary]
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
          // silent fail on parse
        }
      }
    }

    // 2. [ACTION:add_favorites:slug]
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

  const persistGeneratedItinerary = (text) => {
    if (typeof window === 'undefined' || !text) return null;
    const jsonMatch = String(text).match(/\{[\s\S]*?"destination"[\s\S]*?\}/);
    if (!jsonMatch) return null;

    const andorItinerary = safeParse(jsonMatch[0], null);
    if (!andorItinerary?.destination || !Array.isArray(andorItinerary.days)) return null;

    const legacy = convertAndorToLegacy(andorItinerary);
    const id = `gen-${Date.now()}`;
    const destinationName = andorItinerary.destination?.city || legacy.destination || 'Destino';
    const savedTrip = {
      ...legacy,
      id,
      destination: legacy.destination || destinationName,
      daysCount: legacy.days?.length || andorItinerary.days.length,
      totalCost: legacy.totalCost,
      style: legacy.style,
      savedAt: new Date().toISOString(),
    };

    sessionStorage.setItem(`andor_itinerary_${id}`, JSON.stringify(legacy));
    localStorage.setItem(`andor_shared_${id}`, JSON.stringify(legacy));
    localStorage.setItem(`andor_itinerary_${id}`, JSON.stringify(legacy));

    const savedTrips = safeParse(localStorage.getItem('andor_saved_trips'), []);
    if (!savedTrips.some((trip) => trip.id === id || (trip.destination === savedTrip.destination && trip.savedAt === savedTrip.savedAt))) {
      localStorage.setItem('andor_saved_trips', JSON.stringify([savedTrip, ...savedTrips].slice(0, 20)));
    }

    if (destinationName) {
      localStorage.setItem('andor_last_destination', destinationName);
    }
    return id;
  };

  const showToast = (msg, type = 'info') => {
    showGlobalToast(msg, type);
  };

  const handleSend = async (userText = null) => {
    const textToSend = userText || input.trim();
    if (!textToSend || isLoading) return;

    if (!userText) {
      setInput('');
    }

    const userMessage = { role: 'user', content: textToSend, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMessage];
    setResponseSuggestions([]);
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
          destination: currentDestination || inferDestinationFromText(textToSend) || '',
          itinerary: currentItinerary ? { id: currentItinerary } : null,
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
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
          try {
            const {text} = JSON.parse(line.slice(6));
            if (text) {
              assistantMessage += text;
              setMessages(prev => {
                const updated = [...prev];
                updated[targetMsgIndex] = { role: 'assistant', content: assistantMessage, isStreaming: true };
                return updated;
              });
            }
          } catch(e) {}
        }
      }

      if (buffer.startsWith('data: ') && buffer !== 'data: [DONE]') {
        try {
          const {text} = JSON.parse(buffer.slice(6));
          if (text) assistantMessage += text;
        } catch(e) {}
      }

      const parsedResponse = extractSuggestions(assistantMessage);
      setResponseSuggestions(parsedResponse.chips);
      persistGeneratedItinerary(parsedResponse.displayText);

      setMessages(prev => {
        const updated = [...prev];
        updated[targetMsgIndex] = { role: 'assistant', content: parsedResponse.displayText, isStreaming: false };
        if (typeof window !== 'undefined') {
          localStorage.setItem('andor_concierge_messages', JSON.stringify(updated.slice(-20)));
          localStorage.setItem('andor_chat_history', JSON.stringify(updated.slice(-20)));
          const lastDestination = inferDestinationFromText(parsedResponse.displayText) || inferDestinationFromText(textToSend);
          if (lastDestination) localStorage.setItem('andor_last_destination', lastDestination);
        }
        return updated;
      });

      checkAndExecuteActions(parsedResponse.displayText);

    } catch (error) {
      // silent error, show UI fallback instead
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

  const handleSurpriseMe = () => {
    handleSend('Sugere um destino com base apenas nas minhas preferências. Não inventes preços, probabilidade meteorológica, disponibilidade ou condições atuais; explica o que tenho de confirmar.');
  };

  const handleChipClick = (chipText) => {
    if (chipText.includes("Surpreende-me")) {
      handleSurpriseMe();
    } else if (chipText.includes("Planeia uma viagem")) {
      handleSend("Planeia uma viagem incrível de 3 dias para mim. Escolhe um destino europeu fascinante e cria o itinerário completo.");
    } else if (chipText.includes("Melhora o meu itinerário")) {
      const pageInfo = pathname && pathname.includes('/itinerary/') ? ` que estou a ver (${pathname.split('/').pop()})` : '';
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
      localStorage.removeItem('andor_chat_history');
    }
    setShowNewChatConfirm(false);
    setShowRestorePrompt(false);
    showToast('🧹 Nova conversa iniciada.');
  };

  // Get contextual suggestion questions based on last message keywords
  const getContextSuggestions = () => {
    if (responseSuggestions.length > 0) return responseSuggestions;
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
        const budgetMin = andorItinerary.trip?.totalBudgetEstimate?.min || null;

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
              <span className={styles.itineraryIcon}>A</span>
              <div>
                <h4 className={styles.itineraryTitle}>Itinerário criado</h4>
                <p className={styles.itinerarySub}>{city} · {days} dias{budgetMin ? ` · €${budgetMin} est.` : ''}</p>
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
        return <div className={styles.itineraryLoading}>A estruturar o teu itinerário completo...</div>;
      }
    }

    // Render only structured suggestions explicitly returned by the assistant.
    const parts = text.split(/(\[HOTEL:[^\]]+\]|\[RESTAURANT:[^\]]+\]|\[FLIGHT:[^\]]+\])/g);
    
    return (
      <div className={styles.messageContentBlock}>
        <TypewriterText text={text} isStreaming={msg.isStreaming} />
        
        {parts.map((part, idx) => {
          // Hotel Match
          if (part.startsWith('[HOTEL:')) {
            const inner = part.slice(7, -1).split('|');
            const name = inner[0]?.trim();
            const price = inner[2]?.trim() || null;
            const why = inner[3]?.trim() || 'Sugestão gerada por IA; confirma os detalhes no fornecedor.';
            return (
              <div key={idx} className={styles.inlineCard}>
                <div className={styles.inlineCardHeader}>
                  <span className={styles.cardEmoji}>🏨</span>
                  <div style={{ flex: 1 }}>
                    <h5 className={styles.cardName}>{name}</h5>
                    <div className={styles.cardMeta}>
                      {price && <span className={styles.cardPrice}>Estimativa: {price}</span>}
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
          
          // Restaurant Match
          if (part.startsWith('[RESTAURANT:')) {
            const inner = part.slice(12, -1).split('|');
            const name = inner[0]?.trim();
            const price = inner[2]?.trim() || null;
            const note = inner[3]?.trim() || 'Sugestão gerada por IA; confirma os detalhes numa fonte atual.';
            return (
              <div key={idx} className={styles.inlineCard}>
                <div className={styles.inlineCardHeader}>
                  <span className={styles.cardEmoji}>🍽️</span>
                  <div style={{ flex: 1 }}>
                    <h5 className={styles.cardName}>{name}</h5>
                    <div className={styles.cardMeta}>
                      {price && <span className={styles.cardPrice}>Estimativa: {price}</span>}
                    </div>
                  </div>
                </div>
                <p className={styles.cardText}>{note}</p>
                <a 
                  href={`https://www.google.com/search?q=${encodeURIComponent(name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.cardActionLink}
                >
                  Ver detalhes →
                </a>
              </div>
            );
          }
          
          // Flight Match
          if (part.startsWith('[FLIGHT:')) {
            const inner = part.slice(8, -1).split('|');
            const route = inner[0]?.trim() || 'Rota';
            const airline = inner[1]?.trim() || 'Companhia';
            const price = inner[2]?.trim() || null;
            const tip = inner[3]?.trim() || 'Confirma horários, escalas e disponibilidade no fornecedor.';
            return (
              <div key={idx} className={styles.inlineFlightCard}>
                <div className={styles.flightHeader}>
                  <span className={styles.flightBadge}>✈️ Sugestão de Voo</span>
                  {price && <span className={styles.flightPrice}>Estimativa: {price}</span>}
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

        {/* Surprise Me confirmation button */}
        {text.includes("Quer que crie um itinerário completo?") && (
          <div style={{ marginTop: '12px' }}>
            <button 
              className={styles.surpriseItineraryBtn} 
              onClick={() => handleSend("Sim, cria o itinerário para Reykjavik")}
            >
              Sim, cria o itinerário →
            </button>
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
    navigator.clipboard.writeText(clean.trim())
      .then(() => showToast('📋 Copiado para a área de transferência!', 'success'))
      .catch(() => showToast('Não foi possível copiar. Tenta novamente.', 'error'));
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
        data-testid="floating-ai-toggle"
      >
        <div className={styles.particleWrapper}>
          <div className={styles.particleRing1}></div>
          <div className={styles.particleRing2}></div>
        </div>
        
        <span className={styles.toggleIcon}>{isOpen ? 'x' : 'A'}</span>
        
        {hasUnread && (
          <span className={styles.unreadBadge}>{unreadCount}</span>
        )}
        
        <span className={styles.tooltip}>Fala com o teu concierge pessoal</span>
      </button>

      {/* Slide-in Chat Panel */}
      <div className={`${styles.chatWindow} ${isTherapyMode ? styles.therapyTheme : ''}`} data-testid="floating-ai-chat">
        
        {/* Grain/Noise Overlay */}
        <div className={styles.grainOverlay}></div>
        
        {/* Header */}
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderLeft}>
            <div className={styles.logoMark}>A</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className={styles.chatHeaderTitle}>ANDOR AI</div>
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
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Fechar Andor AI">✕</button>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className={styles.quickActionsRow}>
          <button onClick={() => handleSend("Quero planear uma viagem. Podes ajudar-me a escolher destino e datas?")} className={styles.quickActionBtn}>🗺️ Planear Viagem</button>
          <button onClick={() => handleSend(`Quanto custa uma viagem de 5 dias para ${getCurrentDestinationName()}? Orçamento Médio`)} className={styles.quickActionBtn}>💰 Calcular Custo</button>
          <button onClick={() => handleSend(`Quais são as melhores opções de voo de Lisboa para ${getCurrentDestinationName()}?`)} className={styles.quickActionBtn}>✈️ Voos</button>
          <button onClick={() => handleSend(`Que hotel recomendas em ${getCurrentDestinationName()} para orçamento Médio?`)} className={styles.quickActionBtn}>🏨 Hotéis</button>
        </div>

        {/* Restore Prompt Banner */}
        {showRestorePrompt && messages.length > 0 && (
          <div className={styles.restorePromptBanner}>
            <span>💭 Continuamos a planear {getLastDestination()}?</span>
            <div className={styles.restoreBannerActions}>
              <button
                onClick={() => {
                  const destination = getLastDestination();
                  setShowRestorePrompt(false);
                  handleSend(`Vamos continuar a planear ${destination}. Retoma a conversa com o contexto anterior.`);
                }}
                className={styles.restoreYesBtn}
              >
                Sim
              </button>
              <button onClick={handleNewConversation} className={styles.restoreNoBtn}>Não</button>
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
                Eu sou o ANDOR — um assistente de planeamento. Organizo propostas de itinerário e ajudo-te a identificar o que falta confirmar em fontes oficiais.
              </p>
              
              <div className={styles.suggestionGrid}>
                {[
                  "✈️ Planeia uma viagem para mim",
                  "🗺️ Melhora o meu itinerário actual",
                  "💰 Viagem a Tóquio por €800",
                  "🎲 Surpreende-me",
                  "🏨 Encontra-me o hotel perfeito",
                  "⚡ Orientação numa disrupção"
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
                      <div className={styles.revealDestination}>
                        {surpriseData.city}, {surpriseData.country}
                      </div>
                      
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
              aria-label="Mensagem para Andor AI"
              data-testid="floating-ai-input"
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
            aria-label="Enviar mensagem"
            data-testid="floating-ai-send"
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

      <ConfirmDialog
        isOpen={showNewChatConfirm}
        title="Iniciar nova conversa?"
        description="Isto irá apagar todo o histórico de planeamento atual. Esta ação é irreversível."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setShowNewChatConfirm(false)}
        onConfirm={confirmNewChat}
      />
    </div>
  );
}
