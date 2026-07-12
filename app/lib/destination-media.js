const DESTINATION_COVERS = [
  { match: /tokyo|toquio|japan/i, url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1800&q=84' },
  { match: /lisboa|lisbon|portugal/i, url: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1800&q=84' },
  { match: /paris|france/i, url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1800&q=84' },
  { match: /new york|usa|united states/i, url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1800&q=84' },
  { match: /rome|roma|italy/i, url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1800&q=84' },
  { match: /bali|indonesia/i, url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1800&q=84' },
  { match: /marrakech|morocco/i, url: 'https://images.unsplash.com/photo-1553603227-2358aabe821e?auto=format&fit=crop&w=1800&q=84' },
  { match: /barcelona|spain|espanha/i, url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1800&q=84' },
  { match: /azores|acores/i, url: 'https://images.unsplash.com/photo-1582885938164-1af58ee6effa?auto=format&fit=crop&w=1800&q=84' },
  { match: /switzerland|suica/i, url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1800&q=84' },
];

function searchableLabel(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function destinationLabel(destination, fallback = 'Destino') {
  if (typeof destination === 'string') return destination || fallback;
  return [destination?.city || destination?.name, destination?.country]
    .filter(Boolean)
    .join(', ') || fallback;
}

export function getDestinationCover(destination) {
  const label = searchableLabel(destinationLabel(destination, 'viagem'));
  return DESTINATION_COVERS.find((item) => item.match.test(label))?.url
    || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1800&q=84';
}
