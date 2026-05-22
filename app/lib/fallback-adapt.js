export function generateFallbackAdaptedDay(itinerary, activeDayIndex, context) {
  const originalDay = itinerary.days[activeDayIndex];
  const contextLower = context.toLowerCase();
  
  let newStops = [...originalDay.stops];
  let titleSuffix = ' (Adapted)';
  
  if (contextLower.includes('rain') || contextLower.includes('chov') || contextLower.includes('tempestad') || contextLower.includes('storm')) {
    titleSuffix = ' (Indoor Plan 🌧️)';
    newStops = newStops.map(stop => {
      if (stop.isRestaurant || stop.type.toLowerCase().includes('dinner') || stop.type.toLowerCase().includes('lunch') || stop.type.toLowerCase().includes('breakfast')) {
        return stop;
      }
      
      if (stop.name.toLowerCase().includes('viewpoint') || stop.name.toLowerCase().includes('miradouro') || stop.name.toLowerCase().includes('walk') || stop.name.toLowerCase().includes('beach') || stop.name.toLowerCase().includes('praia') || stop.name.toLowerCase().includes('hike') || stop.name.toLowerCase().includes('park') || stop.name.toLowerCase().includes('gardens')) {
        return {
          ...stop,
          name: `${stop.name.replace(/viewpoint|miradouro|walk|beach|praia|hike|park|gardens/gi, '')} National Museum & Art Gallery`,
          type: '🏛️ Culture — Beautiful indoor galleries, historic exhibitions (Rain Alternative)',
          estimatedCost: '€10',
          localSecret: 'Book online to enter through the priority lane and avoid standing in the rain.'
        };
      }
      return {
        ...stop,
        name: `${stop.name} (Indoor Tour)`,
        type: `${stop.type} — Rain shelter adjusted`,
        localSecret: 'Indoor exhibits are highly rated here. Check the temporary collections.'
      };
    });
  } else if (contextLower.includes('tired') || contextLower.includes('cansad') || contextLower.includes('relax') || contextLower.includes('slow') || contextLower.includes('preguiça')) {
    titleSuffix = ' (Relaxed Pace ☕)';
    newStops = newStops.map((stop, idx) => {
      if (idx % 2 === 1 && !stop.isRestaurant) {
        return {
          ...stop,
          name: 'Cozy Neighborhood Cafe & Spa Lounge',
          type: '☕ Relax — Coffee, herbal tea, massage & organic local pastries',
          estimatedCost: '€15',
          localSecret: 'The back room has quiet couches and charging outlets. Perfect to recharge.'
        };
      }
      return {
        ...stop,
        name: `${stop.name} (Slow Pace)`,
        type: `${stop.type} — Arranged for easy walking`,
        localSecret: 'Taxi or tram access is right outside this stop to minimize walking.'
      };
    });
  } else if (contextLower.includes('nature') || contextLower.includes('natureza') || contextLower.includes('forest') || contextLower.includes('green') || contextLower.includes('beach') || contextLower.includes('parque')) {
    titleSuffix = ' (Nature Focus 🌿)';
    newStops = newStops.map(stop => {
      if (stop.isRestaurant) return stop;
      if (stop.type.toLowerCase().includes('museum') || stop.type.toLowerCase().includes('shopping') || stop.type.toLowerCase().includes('gallery') || stop.type.toLowerCase().includes('art')) {
        return {
          ...stop,
          name: 'Botanical Gardens & Eco Path',
          type: '🌿 Nature — Exotic plants, walking trails & fresh air',
          estimatedCost: 'Free',
          localSecret: 'The glass greenhouses house orchids and ancient ferns. A true hidden oasis.'
        };
      }
      return stop;
    });
  } else {
    newStops = newStops.map(stop => ({
      ...stop,
      name: `${stop.name} (${context.length > 15 ? context.slice(0, 15) + '...' : context})`,
      type: `${stop.type} — Adjusted for your request`
    }));
  }

  const originalTitleParts = originalDay.title.split(' — ');
  const baseTitle = originalTitleParts[0];

  return {
    ...originalDay,
    title: `${baseTitle} — ${originalTitleParts[1] || 'Adapted Day'}${titleSuffix}`,
    stops: newStops
  };
}
