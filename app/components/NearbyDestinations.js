'use client';
import { useState, useEffect } from 'react';
import styles from './NearbyDestinations.module.css';

const destinationsData = {
  'lisbon': [
    { name: 'Sintra', distance: '30 km', image: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?q=80&w=300&auto=format&fit=crop', desc: 'Fairy-tale castles & mystical forests.' },
    { name: 'Porto', distance: '310 km', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?q=80&w=300&auto=format&fit=crop', desc: 'World-famous wine cellars & historic riverfront.' },
    { name: 'Algarve', distance: '260 km', image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=300&auto=format&fit=crop', desc: 'Breathtaking golden cliffs & sandy coves.' }
  ],
  'barcelona': [
    { name: 'Costa Brava', distance: '100 km', image: 'https://images.unsplash.com/photo-1512756290469-ec064d1f4ec3?q=80&w=300&auto=format&fit=crop', desc: 'Wild coastline & crystal-clear waters.' },
    { name: 'Montserrat', distance: '50 km', image: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=300&auto=format&fit=crop', desc: 'Spectacular multi-peaked mountain retreat.' },
    { name: 'Sitges', distance: '35 km', image: 'https://images.unsplash.com/photo-1614030424754-24d1e97669d9?q=80&w=300&auto=format&fit=crop', desc: 'Charming seaside resort town with golden beaches.' }
  ],
  'paris': [
    { name: 'Versailles', distance: '20 km', image: 'https://images.unsplash.com/photo-1505576391880-b3f9d713dc4f?q=80&w=300&auto=format&fit=crop', desc: 'Grand Royal Palace & French classical gardens.' },
    { name: 'Champagne Region', distance: '140 km', image: 'https://images.unsplash.com/photo-1562601579-579bc04bf7a2?q=80&w=300&auto=format&fit=crop', desc: 'Infinite vineyards & prestigious bubbly houses.' },
    { name: 'Loire Valley', distance: '200 km', image: 'https://images.unsplash.com/photo-1551634737-142838ec6733?q=80&w=300&auto=format&fit=crop', desc: 'Châteaux-lined river & gourmet wine tours.' }
  ],
  'tokyo': [
    { name: 'Hakone', distance: '85 km', image: 'https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=300&auto=format&fit=crop', desc: 'Hot springs, Mt. Fuji views & shrine gates.' },
    { name: 'Kyoto', distance: '2h by Shinkansen', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=300&auto=format&fit=crop', desc: 'Thousands of classical Buddhist temples & geishas.' },
    { name: 'Kamakura', distance: '50 km', image: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?q=80&w=300&auto=format&fit=crop', desc: 'Giant bronze Buddha & serene coastal walks.' }
  ],
  'switzerland': [
    { name: 'Interlaken', distance: '60 km', image: 'https://images.unsplash.com/photo-1482862549707-f63cb32c5fd9?q=80&w=300&auto=format&fit=crop', desc: 'Adventure hub between two stunning alpine lakes.' },
    { name: 'Lauterbrunnen', distance: '70 km', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=300&auto=format&fit=crop', desc: 'Deep valley of 72 cascading waterfalls.' },
    { name: 'Grindelwald', distance: '75 km', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=300&auto=format&fit=crop', desc: 'Eiger-facing glacier village & ski resort.' }
  ],
  'azores': [
    { name: 'Furnas Valley', distance: '40 km', image: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?q=80&w=300&auto=format&fit=crop', desc: 'Active thermal geysers & volcanic stews.' },
    { name: 'Lagoa do Fogo', distance: '25 km', image: 'https://images.unsplash.com/photo-1522885147691-06d859633fb8?q=80&w=300&auto=format&fit=crop', desc: 'Wild, untouched crater lake high in the mist.' },
    { name: 'Nordeste', distance: '60 km', image: 'https://images.unsplash.com/photo-1535262412227-85541e910204?q=80&w=300&auto=format&fit=crop', desc: 'Dramatic cliffs, waterfalls & hydrangea-lined roads.' }
  ],
  'bali': [
    { name: 'Nusa Penida', distance: '45 min by boat', image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?q=80&w=300&auto=format&fit=crop', desc: 'Iconic T-Rex shaped beach cliff & turquoise sea.' },
    { name: 'Ubud', distance: '30 km', image: 'https://images.unsplash.com/photo-1501179691627-eeab196f74c5?q=80&w=300&auto=format&fit=crop', desc: 'Lush green rice terraces & cultural jungle heart.' },
    { name: 'Lombok', distance: '2h by ferry', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=300&auto=format&fit=crop', desc: 'Primal nature & pristine white sand beaches.' }
  ],
  'new york': [
    { name: 'Brooklyn', distance: 'Across the bridge', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=300&auto=format&fit=crop', desc: 'Hip coffee houses, DUMBO views & street art.' },
    { name: 'Hudson Valley', distance: '80 km', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=300&auto=format&fit=crop', desc: 'Charming river towns & rich historical estates.' },
    { name: 'The Hamptons', distance: '150 km', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=300&auto=format&fit=crop', desc: 'Elite seaside retreats & pristine Atlantic beaches.' }
  ]
};

const defaultNearby = [
  { name: 'Nearby Beach', distance: '15 km', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=300&auto=format&fit=crop', desc: 'A scenic sandy escape near you.' },
  { name: 'Historic Town', distance: '40 km', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=300&auto=format&fit=crop', desc: 'Stunning old city streets to explore.' },
  { name: 'Mountain Peak', distance: '60 km', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=300&auto=format&fit=crop', desc: 'Beautiful vistas and hiking trails.' }
];

export default function NearbyDestinations({ destination = '' }) {
  const [nearby, setNearby] = useState(defaultNearby);

  useEffect(() => {
    const key = destination.toLowerCase();
    let found = null;
    for (const [k, v] of Object.entries(destinationsData)) {
      if (key.includes(k)) {
        found = v;
        break;
      }
    }
    if (found) {
      setNearby(found);
    } else {
      setNearby(defaultNearby);
    }
  }, [destination]);

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>🧭 Destinos Próximos</h3>
      <p className={styles.subtitle}>Enriquece a tua viagem com estas escapadinhas adicionais.</p>
      
      <div className={styles.grid}>
        {nearby.map((d, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.imageWrap}>
              <img
                src={d.image}
                alt={d.name}
                className={styles.image}
                width="360"
                height="240"
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.style.opacity = '0';
                }}
              />
              <div className={styles.distanceBadge}>📍 {d.distance}</div>
            </div>
            <div className={styles.info}>
              <h4 className={styles.cardName}>{d.name}</h4>
              <p className={styles.cardDesc}>{d.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
