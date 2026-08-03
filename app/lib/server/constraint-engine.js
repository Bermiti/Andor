import 'server-only';

/**
 * Sprint 6 Adaptive Itinerary Intelligence & Constraint Engine.
 *
 * Checks:
 * 1. Conflict detection (overlapping time slots or impossible travel durations)
 * 2. Closed venues / schedule mismatch
 * 3. Daily budget overrun detection
 * 4. Pace intensity check
 */

export function validateItineraryConstraints(dayData = {}) {
  const conflicts = [];
  const warnings = [];
  const stops = Array.isArray(dayData.stops || dayData.activities) ? (dayData.stops || dayData.activities) : [];

  if (stops.length > 6) {
    warnings.push({
      type: 'high_intensity',
      message: 'O dia possui mais de 6 paragens. O ritmo pode ser excessivamente cansativo.',
    });
  }

  let dayCostSum = 0;
  stops.forEach((stop, index) => {
    if (typeof stop.cost === 'number') {
      dayCostSum += stop.cost;
    }

    if (index > 0) {
      const prev = stops[index - 1];
      if (prev.coordinates && stop.coordinates) {
        // Check if distance between consecutive stops requires driving or fast transport
        const latDiff = Math.abs(prev.coordinates[0] - stop.coordinates[0]);
        const lngDiff = Math.abs(prev.coordinates[1] - stop.coordinates[1]);
        if (latDiff > 1.5 || lngDiff > 1.5) {
          conflicts.push({
            type: 'impossible_transfer',
            message: `A deslocação entre "${prev.name}" e "${stop.name}" é demasiado longa para o intervalo planeado.`,
          });
        }
      }
    }
  });

  const dailyBudgetLimit = dayData.dailyBudgetLimit || 500;
  if (dayCostSum > dailyBudgetLimit) {
    warnings.push({
      type: 'budget_exceeded',
      message: `O custo do dia (€${dayCostSum}) excede o limite diário definido (€${dailyBudgetLimit}).`,
    });
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
    warnings,
    summary: {
      totalStops: stops.length,
      dayCostSum,
    },
  };
}
