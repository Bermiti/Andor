/**
 * Natural Language Intent Parser
 *
 * Extracts structured trip intent from natural language input in Portuguese, English, or Spanish.
 * Example input: "Quero fazer uma viagem de 5 dias a Itália com a minha namorada em setembro, com boa comida, praias e sem gastar demasiado."
 * Output: { destination, durationDays, dates, travelers, budget, interests, pace, confidence }
 */

const DESTINATION_PATTERNS = [
  // Portuguese patterns
  { regex: /(?:viagem|ir|visitar|passeio|férias|para|a|em)\s+([A-ZÁÀÂÃÉÈÊÍÓÒÔÕÚÇ][a-záàâãéèêíóòôõúçA-Z\s]{2,30})(?:\s+com|\s+em|\s+de|\s+por|\s+para|\s+no|\s+na|,|\.|$)/i, group: 1 },
  // General destination keywords
  { regex: /(?:em|a|para)\s+(Itália|Roma|Paris|Tóquio|Tokyo|Lisboa|Porto|Açores|Madeira|Escócia|Menorca|Espanha|Madrid|Barcelona|Japão|França|Grécia|Santorini|Balas|Bali|Nova Iorque|New York|Amesterdão|Amsterdam|Londres|London|Islândia)/i, group: 1 },
];

const DESTINATION_CANONICAL_MAP = {
  'itália': 'Itália',
  'italia': 'Itália',
  'roma': 'Roma, Itália',
  'paris': 'Paris, França',
  'frança': 'França',
  'franca': 'França',
  'tóquio': 'Tóquio, Japão',
  'tokyo': 'Tóquio, Japão',
  'japão': 'Japão',
  'japao': 'Japão',
  'lisboa': 'Lisboa, Portugal',
  'porto': 'Porto, Portugal',
  'açores': 'Açores, Portugal',
  'acores': 'Açores, Portugal',
  'madeira': 'Madeira, Portugal',
  'escócia': 'Escócia, Reino Unido',
  'escocia': 'Escócia, Reino Unido',
  'menorca': 'Menorca, Espanha',
  'espanha': 'Espanha',
  'madrid': 'Madrid, Espanha',
  'barcelona': 'Barcelona, Espanha',
  'grécia': 'Grécia',
  'grecia': 'Grécia',
  'santorini': 'Santorini, Grécia',
  'bali': 'Bali, Indonésia',
  'nova iorque': 'Nova Iorque, EUA',
  'new york': 'Nova Iorque, EUA',
  'amesterdão': 'Amesterdão, Holanda',
  'amsterdam': 'Amesterdão, Holanda',
  'londres': 'Londres, Reino Unido',
  'london': 'Londres, Reino Unido',
  'islândia': 'Islândia',
  'islandia': 'Islândia',
};

const DURATION_PATTERNS = [
  { regex: /(\d{1,2})\s*(?:dias|dia|days|day)/i, extract: (m) => parseInt(m[1], 10) },
  { regex: /(?:uma|1)\s*semana/i, extract: () => 7 },
  { regex: /(?:duas|2)\s*semanas/i, extract: () => 14 },
  { regex: /fim\s*de\s*semana/i, extract: () => 3 },
  { regex: /weekend/i, extract: () => 3 },
];

const MONTH_MAP = {
  janeiro: '01', january: '01',
  fevereiro: '02', february: '02',
  março: '03', marco: '03', march: '03',
  abril: '04', april: '04',
  maio: '05', may: '05',
  junho: '06', june: '06',
  julho: '07', july: '07',
  agosto: '08', august: '08',
  setembro: '09', september: '09',
  outubro: '10', october: '10',
  novembro: '11', november: '11',
  dezembro: '12', december: '12',
};

const COMPANION_PATTERNS = [
  { regex: /(?:com\s+a\s+minha\s+namorada|com\s+o\s+meu\s+namorado|com\s+a\s+minha\s+esposa|com\s+o\s+meu\s+marido|em\s+casal|romântic[ao]|com\s+o\s+meu\s+par)/i, type: 'couple', adults: 2, children: 0, label: 'Casal' },
  { regex: /(?:com\s+(?:os\s+meus\s+)?filhos|em\s+família|com\s+crianças)/i, type: 'family', adults: 2, children: 2, label: 'Família' },
  { regex: /(?:sozinho|sozinha|solo)/i, type: 'solo', adults: 1, children: 0, label: 'Viagem Solo' },
  { regex: /(?:com\s+(?:os\s+meus\s+)?amigos|com\s+um\s+grupo)/i, type: 'friends', adults: 4, children: 0, label: 'Grupo de Amigos' },
];

const BUDGET_PATTERNS = [
  { regex: /(?:económic[ao]|barat[ao]|poupar|sem\s+gastar\s+(?:muito|demasiado)|orçamento\s+curto|low\s+budget)/i, tier: 'economic', label: 'Económico' },
  { regex: /(?:luxo|luxury|5\s*estrelas|premium|sem\s+olhar\s+a\s+gastos)/i, tier: 'luxury', label: 'Luxo' },
  { regex: /(?:moderado|equilibrado|médio|razoável)/i, tier: 'moderate', label: 'Equilibrado' },
];

const INTEREST_KEYWORDS = [
  { keywords: ['comida', 'gastronomia', 'restaurantes', 'comer', 'vinhos', 'culinária', 'food'], id: 'gastronomy', label: 'Gastronomia' },
  { keywords: ['praia', 'praias', 'mar', 'sol', 'beach'], id: 'beach', label: 'Praia & Mar' },
  { keywords: ['cultura', 'museus', 'história', 'monumentos', 'arte', 'culture'], id: 'culture', label: 'Cultura & História' },
  { keywords: ['natureza', 'trilhos', 'caminhadas', 'montanha', 'parques', 'nature'], id: 'nature', label: 'Natureza' },
  { keywords: ['noite', 'bares', 'festas', 'diversão', 'nightlife'], id: 'nightlife', label: 'Vida Noturna' },
  { regex: /(?:relax|descanso|tranquilo|descontrair|spa)/i, id: 'relaxation', label: 'Descanso & Relax' },
  { keywords: ['compras', 'shopping', 'lojas'], id: 'shopping', label: 'Compras' },
];

const PACE_PATTERNS = [
  { regex: /(?:com\s+calma|tranquil[ao]|relaxad[ao]|sem\s+pressa|ritmo\s+lento)/i, pace: 'relaxed', label: 'Tranquilo' },
  { regex: /(?:ver\s+tudo|intenso|aproveitar\s+ao\s+máximo|ritmo\s+rápido)/i, pace: 'fast', label: 'Intenso' },
];

export function parseNaturalLanguageIntent(text = '') {
  const input = String(text || '').trim();
  if (!input) {
    return {
      destination: null,
      durationDays: 5,
      dates: null,
      travelers: { type: 'couple', adults: 2, children: 0, label: 'Casal' },
      budget: { tier: 'moderate', label: 'Equilibrado' },
      interests: [],
      pace: { pace: 'balanced', label: 'Equilibrado' },
      confidence: { overall: 0, fields: {} },
      rawText: input,
    };
  }

  const confidence = { overall: 0, fields: {} };
  const lowerInput = input.toLowerCase();

  // 1. Destination Extraction
  let destination = null;
  for (const [key, canonical] of Object.entries(DESTINATION_CANONICAL_MAP)) {
    if (lowerInput.includes(key)) {
      destination = canonical;
      confidence.fields.destination = 0.95;
      break;
    }
  }

  if (!destination) {
    for (const pattern of DESTINATION_PATTERNS) {
      const match = input.match(pattern.regex);
      if (match && match[pattern.group]) {
        const candidate = match[pattern.group].trim();
        if (candidate.length > 2 && !['viagem', 'dias', 'semana', 'minha', 'meu', 'nosso'].includes(candidate.toLowerCase())) {
          destination = candidate.charAt(0).toUpperCase() + candidate.slice(1);
          confidence.fields.destination = 0.7;
          break;
        }
      }
    }
  }

  // 2. Duration Extraction
  let durationDays = null;
  for (const pattern of DURATION_PATTERNS) {
    const match = input.match(pattern.regex);
    if (match) {
      durationDays = pattern.extract(match);
      confidence.fields.durationDays = 0.9;
      break;
    }
  }
  if (!durationDays) durationDays = 5; // Default fallback

  // 3. Dates / Month Extraction
  let dates = null;
  for (const [monthName, monthNum] of Object.entries(MONTH_MAP)) {
    if (lowerInput.includes(monthName)) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const targetYear = parseInt(monthNum, 10) < currentMonth ? currentYear + 1 : currentYear;
      dates = {
        month: monthName,
        approximateDate: `${targetYear}-${monthNum}-01`,
        label: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${targetYear}`,
      };
      confidence.fields.dates = 0.85;
      break;
    }
  }

  // 4. Travelers / Companions Extraction
  let travelers = { type: 'couple', adults: 2, children: 0, label: 'Casal' };
  for (const pattern of COMPANION_PATTERNS) {
    if (pattern.regex.test(input)) {
      travelers = {
        type: pattern.type,
        adults: pattern.adults,
        children: pattern.children,
        label: pattern.label,
      };
      confidence.fields.travelers = 0.9;
      break;
    }
  }

  // 5. Budget Extraction
  let budget = { tier: 'moderate', label: 'Equilibrado' };
  for (const pattern of BUDGET_PATTERNS) {
    if (pattern.regex.test(input)) {
      budget = { tier: pattern.tier, label: pattern.label };
      confidence.fields.budget = 0.85;
      break;
    }
  }

  // 6. Interests / Vibes Extraction
  const interests = [];
  for (const item of INTEREST_KEYWORDS) {
    if (item.keywords && item.keywords.some((kw) => lowerInput.includes(kw))) {
      interests.push({ id: item.id, label: item.label });
    } else if (item.regex && item.regex.test(input)) {
      interests.push({ id: item.id, label: item.label });
    }
  }
  if (interests.length > 0) {
    confidence.fields.interests = 0.9;
  }

  // 7. Pace Extraction
  let pace = { pace: 'balanced', label: 'Equilibrado' };
  for (const pattern of PACE_PATTERNS) {
    if (pattern.regex.test(input)) {
      pace = { pace: pattern.pace, label: pattern.label };
      confidence.fields.pace = 0.85;
      break;
    }
  }

  // Calculate overall confidence score (0 to 1)
  const evaluatedFields = Object.keys(confidence.fields);
  const totalScore = evaluatedFields.reduce((sum, f) => sum + confidence.fields[f], 0);
  confidence.overall = evaluatedFields.length > 0 ? Math.round((totalScore / Math.max(evaluatedFields.length, 3)) * 100) / 100 : 0.3;

  return {
    destination,
    durationDays,
    dates,
    travelers,
    budget,
    interests,
    pace,
    confidence,
    rawText: input,
  };
}

/**
 * Returns user-facing chips representing the extracted structured data.
 */
export function buildConfirmationChips(intent) {
  if (!intent) return [];

  const chips = [];

  if (intent.destination) {
    chips.push({ key: 'destination', label: intent.destination, type: 'primary', icon: '📍' });
  } else {
    chips.push({ key: 'destination', label: 'Destino a escolher', type: 'missing', icon: '📍' });
  }

  if (intent.durationDays) {
    chips.push({ key: 'durationDays', label: `${intent.durationDays} dias`, type: 'confirmed', icon: '📅' });
  }

  if (intent.dates?.label) {
    chips.push({ key: 'dates', label: intent.dates.label, type: 'confirmed', icon: '🗓️' });
  }

  if (intent.travelers?.label) {
    chips.push({ key: 'travelers', label: intent.travelers.label, type: 'confirmed', icon: '👥' });
  }

  if (intent.budget?.label) {
    chips.push({ key: 'budget', label: intent.budget.label, type: 'confirmed', icon: '💳' });
  }

  if (Array.isArray(intent.interests) && intent.interests.length > 0) {
    intent.interests.forEach((int) => {
      chips.push({ key: `interest_${int.id}`, label: int.label, type: 'tag', icon: '✨' });
    });
  }

  return chips;
}
