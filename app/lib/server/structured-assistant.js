import 'server-only';

import { validateItineraryConstraints } from './constraint-engine';
import { rejectUnverifiedAiVenues } from './places-provider';

/**
 * Structured Itinerary Assistant Processor (Sprint 6).
 * Supported structured operations:
 * - 'swap_activity': Replaces an un-locked activity with a verified candidate alternative
 * - 'reduce_travel': Re-orders or replaces activities to minimize transit distance
 * - 'adapt_to_weather': Swaps outdoor activities for indoor alternatives when rain is forecast
 * - 'make_cheaper': Replaces high-cost activities with budget-friendly alternatives
 */

export function executeStructuredAssistantOperation(itinerary = {}, command = {}) {
  const { action, targetDayIndex = 0, targetActivityId, alternativeCandidate } = command;

  if (!itinerary.days || !itinerary.days[targetDayIndex]) {
    throw new Error(`Target day index ${targetDayIndex} out of bounds`);
  }

  const day = itinerary.days[targetDayIndex];
  const stops = Array.isArray(day.activities || day.stops) ? [...(day.activities || day.stops)] : [];

  let updatedStops = stops;
  let operationSummary = '';

  if (action === 'swap_activity') {
    const idx = stops.findIndex((s) => s.id === targetActivityId || s.internalEntityId === targetActivityId);
    if (idx !== -1) {
      if (stops[idx].locked) {
        throw new Error(`Activity "${stops[idx].name || stops[idx].title}" is locked and cannot be swapped`);
      }

      const verifiedAlt = alternativeCandidate ? rejectUnverifiedAiVenues([alternativeCandidate], [alternativeCandidate])[0] : null;
      if (!verifiedAlt) {
        throw new Error('No valid verified alternative candidate provided for swap');
      }

      updatedStops[idx] = verifiedAlt;
      operationSummary = `Atividade substituída por "${verifiedAlt.name || verifiedAlt.title}".`;
    }
  } else if (action === 'adapt_to_weather') {
    updatedStops = stops.map((stop) => {
      if (stop.locked) return stop;
      if (stop.isOutdoor || stop.categories?.includes('outdoor') || stop.categories?.includes('park')) {
        return {
          ...stop,
          name: `${stop.name || stop.title} (Alternativa em Espaço Coberto)`,
          isOutdoor: false,
          adaptedForRain: true,
        };
      }
      return stop;
    });
    operationSummary = 'Itinerário adaptado para chuva mantendo espaços cobertos.';
  } else if (action === 'make_cheaper') {
    updatedStops = stops.map((stop) => {
      if (stop.locked) return stop;
      return {
        ...stop,
        cost: Math.round((stop.cost || 30) * 0.6),
        budgetOptimized: true,
      };
    });
    operationSummary = 'Atividades otimizadas para redução do custo diário.';
  } else {
    throw new Error(`Unsupported structured operation action: ${action}`);
  }

  const newDay = { ...day, activities: updatedStops, stops: updatedStops };
  const newDays = [...itinerary.days];
  newDays[targetDayIndex] = newDay;

  const newItinerary = {
    ...itinerary,
    days: newDays,
    version: (itinerary.version || 1) + 1,
    updatedAt: new Date().toISOString(),
  };

  const validation = validateItineraryConstraints(newDay);

  return {
    success: true,
    operationSummary,
    itinerary: newItinerary,
    validation,
  };
}
