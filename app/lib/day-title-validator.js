/**
 * DAY TITLE VALIDATION — Ensures evocative, specific titles
 * BANNED: "Explore Tokyo", "Day in Paris", "Visit Bali", "Day 1 in [City]"
 * REQUIRED: Story-driven, unique, sensory titles
 */

const BANNED_PATTERNS = [
  /^explore\s+/i,
  /^day\s+in\s+/i,
  /^day\s+\d+\s+in\s+/i,
  /^visit\s+/i,
  /^\d+\s*(?:st|nd|rd|th)?\s+day\s+in\s+/i,
  /^a\s+day\s+in\s+/i,
  /^\[day\s+\d+\]/i,
  /^day\s*\d+$/i,
  /^placeholder/i,
  /^lorem/i,
];

const QUALITY_INDICATORS = [
  /[:\-—]/,  // Has punctuation (separator between concepts)
  /[\w]+ing\s+[\w]+/,  // Gerunds (action-oriented)
  /\b(discover|escape|dive|wake|sunrise|sunset|dawn|dusk|night|hidden|secret|local|ancient|modern)\b/i,
  /[&×]/,  // Ampersands or multiplication signs (multiple concepts)
];

export function isBannedDayTitle(title) {
  if (!title || typeof title !== 'string') return false;
  const t = title.trim();
  return BANNED_PATTERNS.some(pattern => pattern.test(t));
}

export function getDayTitleQualityScore(title) {
  if (!title || typeof title !== 'string') return 0;
  const t = title.trim();
  
  if (isBannedDayTitle(t)) return 0;
  
  let score = 0;
  if (t.length >= 15 && t.length <= 80) score += 30;
  
  QUALITY_INDICATORS.forEach(indicator => {
    if (indicator.test(t)) score += 20;
  });
  
  return Math.min(score, 100);
}

export function validateDayTitle(title) {
  const isBanned = isBannedDayTitle(title);
  const qualityScore = getDayTitleQualityScore(title);
  
  return {
    valid: !isBanned && qualityScore >= 40,
    isBanned,
    qualityScore,
    title: title || '',
    feedback: isBanned 
      ? `❌ Title "${title}" is too generic. Use specific, story-driven titles.`
      : qualityScore < 40
      ? `⚠️ Title "${title}" lacks specificity. Make it more evocative.`
      : `✅ Title "${title}" is good!`,
  };
}

export function validateAllDayTitles(itinerary) {
  const results = [];
  const titles = new Set();
  
  if (!itinerary?.days || !Array.isArray(itinerary.days)) {
    return { valid: false, errors: ['No days array found'], results: [] };
  }
  
  const errors = [];
  
  itinerary.days.forEach((day, idx) => {
    const title = day.title || day.dayTitle || '';
    const validation = validateDayTitle(title);
    
    results.push({
      dayIndex: idx,
      title,
      ...validation,
    });
    
    if (!validation.valid) {
      errors.push(`Day ${idx + 1}: ${validation.feedback}`);
    }
    
    if (titles.has(title)) {
      errors.push(`Day ${idx + 1}: Title "${title}" is duplicate`);
    }
    titles.add(title);
  });
  
  return {
    valid: errors.length === 0,
    errors,
    results,
    duplicates: Array.from(titles).filter((t, i, arr) => arr.indexOf(t) !== i),
  };
}

/**
 * Suggest evocative titles based on day theme and activities
 */
export function suggestDayTitle(day, destination) {
  const activities = [];
  
  if (day.periods?.morning?.activities) {
    activities.push(...day.periods.morning.activities.map(a => a.name || a.type));
  }
  if (day.periods?.afternoon?.activities) {
    activities.push(...day.periods.afternoon.activities.map(a => a.name || a.type));
  }
  if (day.periods?.evening?.activities) {
    activities.push(...day.periods.evening.activities.map(a => a.name || a.type));
  }
  
  const meals = [];
  if (day.meals?.breakfast) meals.push('breakfast');
  if (day.meals?.lunch) meals.push('lunch');
  if (day.meals?.dinner) meals.push('dinner');
  
  const theme = day.theme || '';
  const dayIndex = day.dayIndex || 0;
  
  // Rule-based suggestions
  if (dayIndex === 0 && theme.toLowerCase().includes('arrival')) {
    return `Arrival & Awakening — First Steps in ${destination}`;
  }
  
  if (activities.some(a => a.toLowerCase().includes('temple') || a.toLowerCase().includes('shrine'))) {
    return `Sacred Silence — Ancient Temples & Golden Light`;
  }
  
  if (activities.some(a => a.toLowerCase().includes('market') || a.toLowerCase().includes('street'))) {
    return `Urban Pulse — Street Markets & Local Buzz`;
  }
  
  if (activities.some(a => a.toLowerCase().includes('food') || a.toLowerCase().includes('cooking'))) {
    return `A Taste of ${destination} — Culinary Deep Dive`;
  }
  
  if (meals.includes('lunch') && meals.includes('dinner') && activities.length >= 2) {
    return `Feast & Exploration — ${activities[0]} to Hidden Corners`;
  }
  
  // Generic fallback (should be replaced by more specific)
  if (activities.length > 0) {
    return `${activities[0]} & Local Secrets — The ${destination} Experience`;
  }
  
  return `Day ${dayIndex + 1} in ${destination}`;
}
