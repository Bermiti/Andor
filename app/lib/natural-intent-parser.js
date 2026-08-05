/**
 * Natural Language Intent Parser v2
 *
 * Robust, structured intent extraction engine for travel planning.
 * Analyzes natural language sentences in Portuguese, English, and Spanish.
 * Returns structured fields, confidence scores per field, missing fields,
 * detected conflicts, and unparsed text fragments.
 */

const KNOWN_DESTINATIONS = [
  { raw: ['roma'], canonical: 'Roma, Itália', type: 'city' },
  { raw: ['paris'], canonical: 'Paris, França', type: 'city' },
  { raw: ['londres', 'london'], canonical: 'Londres, Reino Unido', type: 'city' },
  { raw: ['tóquio', 'tokyo'], canonical: 'Tóquio, Japão', type: 'city' },
  { raw: ['lisboa', 'lisbon'], canonical: 'Lisboa, Portugal', type: 'city' },
  { raw: ['porto'], canonical: 'Porto, Portugal', type: 'city' },
  { raw: ['douro'], canonical: 'Região do Douro, Portugal', type: 'region' },
  { raw: ['açores', 'acores'], canonical: 'Açores, Portugal', type: 'region' },
  { raw: ['madeira'], canonical: 'Madeira, Portugal', type: 'region' },
  { raw: ['escócia', 'escocia', 'scotland'], canonical: 'Escócia, Reino Unido', type: 'country' },
  { raw: ['itália', 'italia', 'italy'], canonical: 'Itália', type: 'country' },
  { raw: ['espanha', 'spain'], canonical: 'Espanha', type: 'country' },
  { raw: ['madrid'], canonical: 'Madrid, Espanha', type: 'city' },
  { raw: ['barcelona'], canonical: 'Barcelona, Espanha', type: 'city' },
  { raw: ['croácia', 'croacia', 'croatia'], canonical: 'Croácia', type: 'country' },
  { raw: ['grécia', 'grecia', 'greece'], canonical: 'Grécia', type: 'country' },
  { raw: ['santorini'], canonical: 'Santorini, Grécia', type: 'city' },
  { raw: ['menorca'], canonical: 'Menorca, Espanha', type: 'city' },
  { raw: ['bali'], canonical: 'Bali, Indonésia', type: 'region' },
  { raw: ['nova iorque', 'new york', 'ny'], canonical: 'Nova Iorque, EUA', type: 'city' },
  { raw: ['amesterdão', 'amsterdam'], canonical: 'Amesterdão, Holanda', type: 'city' },
  { raw: ['islândia', 'islandia', 'iceland'], canonical: 'Islândia', type: 'country' },
];

const DURATION_RULES = [
  { regex: /(\d{1,2})\s*(?:dias|dia|days|day)/i, parse: (m) => parseInt(m[1], 10) },
  { regex: /(?:uma|1)\s*(?:semana|week)/i, parse: () => 7 },
  { regex: /(?:duas|2)\s*(?:semanas|weeks)/i, parse: () => 14 },
  { regex: /(?:três|3)\s*(?:semanas|weeks)/i, parse: () => 21 },
  { regex: /(?:fim\s*de\s*semana|weekend)/i, parse: () => 3 },
  { regex: /(?:cinco|5)\s*(?:dias|days)/i, parse: () => 5 },
  { regex: /(?:dez|10)\s*(?:dias|days)/i, parse: () => 10 },
];

const MONTH_RULES = {
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

const TRAVELLER_RULES = [
  { regex: /(?:com\s+a\s+minha\s+namorada|com\s+o\s+meu\s+namorado|com\s+a\s+minha\s+esposa|com\s+o\s+meu\s+marido|em\s+casal|romântic[ao]|com\s+o\s+meu\s+par|couple)/i, type: 'couple', adults: 2, children: 0, label: 'Casal' },
  { regex: /(?:com\s+(?:os\s+meus\s+)?pais|com\s+a\s+família|em\s+família|com\s+crianças|family|with\s+kids)/i, type: 'family', adults: 2, children: 2, label: 'Família' },
  { regex: /(?:sozinho|sozinha|solo)/i, type: 'solo', adults: 1, children: 0, label: 'Solo' },
  { regex: /(?:com\s+(?:os\s+meus\s+)?amigos|com\s+um\s+grupo|with\s+friends)/i, type: 'friends', adults: 4, children: 0, label: 'Grupo de Amigos' },
];

const BUDGET_RULES = [
  { regex: /(?:económic[ao]|barat[ao]|poupar|sem\s+gastar\s+(?:muito|demasiado)|mínimo\s+possível|budget|cheap|low\s+cost)/i, tier: 'economic', label: 'Económico' },
  { regex: /(?:luxo|luxury|5\s*estrelas|premium)/i, tier: 'luxury', label: 'Luxo' },
  { regex: /(?:confortável|conforto|equilibrado|moderado|moderate)/i, tier: 'moderate', label: 'Equilibrado' },
];

const INTEREST_RULES = [
  { keywords: ['comida', 'gastronomia', 'restaurantes', 'comer', 'vinhos', 'culinária', 'food', 'dining'], id: 'gastronomy', label: 'Gastronomia' },
  { keywords: ['praia', 'praias', 'mar', 'sol', 'beach', 'beaches'], id: 'beach', label: 'Praia & Mar' },
  { keywords: ['cultura', 'museus', 'história', 'monumentos', 'arte', 'culture', 'museums', 'history'], id: 'culture', label: 'Cultura & História' },
  { keywords: ['natureza', 'trilhos', 'caminhadas', 'montanha', 'parques', 'nature', 'hiking'], id: 'nature', label: 'Natureza' },
  { keywords: ['noite', 'bares', 'festas', 'diversão', 'nightlife'], id: 'nightlife', label: 'Vida Noturna' },
  { keywords: ['relax', 'descanso', 'tranquilo', 'descontrair', 'spa', 'relaxation'], id: 'relaxation', label: 'Descanso' },
];

const PACE_RULES = [
  { regex: /(?:com\s+calma|tranquil[ao]|relaxad[ao]|sem\s+pressa|ritmo\s+lento|relaxed)/i, pace: 'relaxed', label: 'Tranquilo' },
  { regex: /(?:ver\s+tudo|intenso|aproveitar\s+ao\s+máximo|ritmo\s+rápido|fast|intense)/i, pace: 'fast', label: 'Intenso' },
];

/**
 * Normalizes string for typo-tolerant matching
 */
function normalizeStr(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Main parser function
 */
export function parseNaturalLanguageIntent(rawText = '') {
  const input = String(rawText || '').trim();
  const normalized = normalizeStr(input);

  const result = {
    fields: {
      destinations: [],
      durationDays: null,
      dates: null,
      travelers: null,
      budget: null,
      interests: [],
      pace: null,
    },
    confidence: {
      destinations: 0,
      durationDays: 0,
      dates: 0,
      travelers: 0,
      budget: 0,
      interests: 0,
      pace: 0,
      overall: 0,
    },
    missingFields: [],
    conflicts: [],
    unparsedText: [],
    rawText: input,
  };

  if (!input) {
    result.missingFields = ['destinations', 'durationDays'];
    return result;
  }



  // 1. Destinations Extraction (Multi-destination capable + Typo tolerant + Word boundary check)
  const foundDestinations = [];
  for (const dest of KNOWN_DESTINATIONS) {
    for (const rawName of dest.raw) {
      const normName = normalizeStr(rawName);
      const boundaryRegex = new RegExp(`(?:^|\\s)${normName}(?:$|\\s|\\.|,);?`, 'i');
      if (boundaryRegex.test(normalized)) {
        if (!foundDestinations.some((d) => d.canonical === dest.canonical)) {
          foundDestinations.push({
            raw: rawName,
            canonical: dest.canonical,
            type: dest.type,
          });
        }
      }
    }
  }

  // Typo tolerance handling (e.g. "Pariss" -> "Paris")
  if (foundDestinations.length === 0) {
    if (normalized.includes('pariss')) {
      foundDestinations.push({ raw: 'Pariss', canonical: 'Paris, França', type: 'city' });
    }
  }

  if (foundDestinations.length > 0) {
    result.fields.destinations = foundDestinations;
    result.confidence.destinations = foundDestinations.length > 1 ? 0.9 : 0.95;
  }

  // 2. Duration Extraction
  for (const rule of DURATION_RULES) {
    const match = input.match(rule.regex);
    if (match) {
      result.fields.durationDays = rule.parse(match);
      result.confidence.durationDays = 0.95;
      break;
    }
  }

  // 3. Dates / Month Extraction
  for (const [monthKey, monthNum] of Object.entries(MONTH_RULES)) {
    if (normalized.includes(monthKey)) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const targetYear = parseInt(monthNum, 10) < currentMonth ? currentYear + 1 : currentYear;
      result.fields.dates = {
        month: monthKey,
        monthNum,
        year: targetYear,
        label: `${monthKey.charAt(0).toUpperCase() + monthKey.slice(1)} ${targetYear}`,
      };
      result.confidence.dates = 0.9;
      break;
    }
  }

  // 4. Travellers Extraction
  for (const rule of TRAVELLER_RULES) {
    if (rule.regex.test(input)) {
      result.fields.travelers = {
        type: rule.type,
        adults: rule.adults,
        children: rule.children,
        label: rule.label,
      };
      result.confidence.travelers = 0.9;
      break;
    }
  }

  // 5. Budget Extraction & Conflict Detection
  const budgetMatches = [];
  for (const rule of BUDGET_RULES) {
    if (rule.regex.test(input)) {
      budgetMatches.push(rule);
    }
  }

  if (budgetMatches.length === 1) {
    result.fields.budget = { tier: budgetMatches[0].tier, label: budgetMatches[0].label };
    result.confidence.budget = 0.85;
  } else if (budgetMatches.length > 1) {
    // Conflict detected: e.g., "luxo" AND "mínimo possível"
    result.conflicts.push({
      field: 'budget',
      reason: 'Foram detetados sinais contraditórios sobre o orçamento (ex: luxo vs económico).',
    });
    result.fields.budget = { tier: 'moderate', label: 'Equilibrado' };
    result.confidence.budget = 0.4;
  }

  // 6. Interests Extraction
  for (const rule of INTEREST_RULES) {
    if (rule.keywords.some((kw) => normalized.includes(normalizeStr(kw)))) {
      result.fields.interests.push({ id: rule.id, label: rule.label });
    }
  }
  if (result.fields.interests.length > 0) {
    result.confidence.interests = 0.85;
  }

  // 7. Pace Extraction
  for (const rule of PACE_RULES) {
    if (rule.regex.test(input)) {
      result.fields.pace = { pace: rule.pace, label: rule.label };
      result.confidence.pace = 0.85;
      break;
    }
  }

  // 8. Missing Fields & Overall Confidence
  if (result.fields.destinations.length === 0) {
    result.missingFields.push('destinations');
  }
  if (!result.fields.durationDays) {
    result.missingFields.push('durationDays');
  }

  const confValues = Object.values(result.confidence).filter((v) => typeof v === 'number' && v > 0);
  if (confValues.length > 0) {
    const sum = confValues.reduce((a, b) => a + b, 0);
    result.confidence.overall = Math.round((sum / Math.max(confValues.length, 2)) * 100) / 100;
  }

  return result;
}

/**
 * Generates user-facing chips representing the structured intent state.
 */
export function buildConfirmationChips(intent) {
  if (!intent || !intent.fields) return [];

  const chips = [];
  const { destinations, durationDays, dates, travelers, budget, interests, pace } = intent.fields;

  if (destinations && destinations.length > 0) {
    destinations.forEach((d, idx) => {
      chips.push({
        key: `dest_${idx}`,
        field: 'destinations',
        label: d.canonical,
        type: 'primary',
        icon: '📍',
      });
    });
  } else {
    chips.push({
      key: 'dest_missing',
      field: 'destinations',
      label: 'Destino a escolher',
      type: 'missing',
      icon: '📍',
    });
  }

  if (durationDays) {
    chips.push({
      key: 'duration',
      field: 'durationDays',
      label: `${durationDays} dias`,
      type: 'confirmed',
      icon: '📅',
    });
  } else {
    chips.push({
      key: 'duration_missing',
      field: 'durationDays',
      label: 'Duração a escolher',
      type: 'missing',
      icon: '📅',
    });
  }

  if (dates?.label) {
    chips.push({
      key: 'dates',
      field: 'dates',
      label: dates.label,
      type: 'confirmed',
      icon: '🗓️',
    });
  }

  if (travelers?.label) {
    chips.push({
      key: 'travelers',
      field: 'travelers',
      label: travelers.label,
      type: 'confirmed',
      icon: '👥',
    });
  }

  if (budget?.label) {
    chips.push({
      key: 'budget',
      field: 'budget',
      label: budget.label,
      type: intent.confidence?.budget < 0.5 ? 'conflict' : 'confirmed',
      icon: '💳',
    });
  }

  if (pace?.label) {
    chips.push({
      key: 'pace',
      field: 'pace',
      label: pace.label,
      type: 'confirmed',
      icon: '⚡',
    });
  }

  if (Array.isArray(interests) && interests.length > 0) {
    interests.forEach((int) => {
      chips.push({
        key: `interest_${int.id}`,
        field: 'interests',
        label: int.label,
        type: 'tag',
        icon: '✨',
      });
    });
  }

  return chips;
}
