'use client';
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CountryManager from '../components/CountryManager';
import TripHistory from '../components/TripHistory';
import styles from './page.module.css';
import { safeParse } from '../lib/safe-json';
import { useTranslations } from '../context/LanguageContext';
import { getStoredJourneyTrips } from '../lib/itinerary-store';
// Dynamic import for the Globe (needs browser APIs, no SSR)
const GlobeTracker = dynamic(() => import('../components/GlobeTracker'), {
  ssr: false,
  loading: () => (
    <div className={styles.globePlaceholder}>
      <div className={styles.placeholderSpinner}></div>
      <p>...</p>
    </div>
  ),
});


const DEMO_TRIPS = [
  {
    id: 'demo-china',
    destination: 'Beijing, China',
    savedAt: '2025-09-15T10:00:00Z',
    style: 'Cultural',
    totalCost: '¥8,500',
    tripOverview: 'A 3-day deep dive into Beijing\'s imperial history, from the Forbidden City to the Great Wall.',
    days: [
      {
        title: 'Day 1 — Imperial Beijing',
        stops: [
          { time: '08:00', name: 'Tiananmen Square', type: '📸 Landmark — World\'s largest public square' },
          { time: '09:30', name: 'Forbidden City', type: '🏛️ UNESCO — Imperial palace complex' },
          { time: '12:30', name: 'Jingshan Park', type: '🌳 Viewpoint — Panoramic city views' },
          { time: '13:30', name: 'Nanluoguxiang Hutong', type: '🍽️ Lunch — Street food in historic alley' },
          { time: '15:30', name: 'Temple of Heaven', type: '⛩️ UNESCO — Ming dynasty temple' },
          { time: '18:00', name: 'Wangfujing Night Market', type: '🍢 Dinner — Exotic street food' },
        ],
      },
      {
        title: 'Day 2 — The Great Wall',
        stops: [
          { time: '06:30', name: 'Hotel Pickup', type: '🚗 Transfer — Drive to Mutianyu section' },
          { time: '09:00', name: 'Great Wall of China (Mutianyu)', type: '🏔️ UNESCO — Hike the restored section' },
          { time: '12:00', name: 'Toboggan Ride Down', type: '🎢 Fun — Slide down the mountain' },
          { time: '13:00', name: 'Local Village Lunch', type: '🍽️ Lunch — Homestyle Chinese cuisine' },
          { time: '16:00', name: 'Summer Palace', type: '🏯 UNESCO — Imperial garden retreat' },
          { time: '19:00', name: 'Peking Duck Dinner', type: '🦆 Dinner — Quanjude, since 1864' },
        ],
      },
      {
        title: 'Day 3 — Art & Modern Beijing',
        stops: [
          { time: '09:00', name: '798 Art District', type: '🎨 Art — Contemporary galleries in old factory' },
          { time: '11:30', name: 'Bird\'s Nest & Water Cube', type: '🏟️ Architecture — Olympic Park' },
          { time: '13:00', name: 'Ghost Street (Guijie)', type: '🌶️ Lunch — Spicy crayfish street' },
          { time: '15:00', name: 'Lama Temple', type: '⛩️ Culture — Tibetan Buddhist temple' },
          { time: '17:00', name: 'Tea Ceremony Experience', type: '🍵 Culture — Traditional tea house' },
          { time: '19:30', name: 'Sanlitun District', type: '🍸 Dinner — Rooftop bar & cocktails' },
        ],
      },
    ],
  },
  {
    id: 'demo-portugal',
    destination: 'Lisbon, Portugal',
    savedAt: '2025-11-02T14:30:00Z',
    style: 'Cultural',
    totalCost: '€320',
    tripOverview: 'Explore Lisbon\'s soul — from Alfama\'s fado houses to Belém\'s iconic pastéis de nata.',
    days: [
      {
        title: 'Day 1 — Historic Alfama & Belém',
        stops: [
          { time: '09:00', name: 'Pastéis de Belém', type: '☕ Breakfast — The original pastel de nata' },
          { time: '10:30', name: 'Jerónimos Monastery', type: '🏛️ UNESCO — Manueline masterpiece' },
          { time: '12:30', name: 'Torre de Belém', type: '🏰 Landmark — Iconic riverside tower' },
          { time: '13:30', name: 'Time Out Market', type: '🍽️ Lunch — Gourmet food hall' },
          { time: '15:30', name: 'Tram 28 Ride', type: '🚋 Experience — Through the old quarters' },
          { time: '17:00', name: 'Miradouro da Graça', type: '🌅 Viewpoint — Sunset over the city' },
          { time: '20:00', name: 'Taberna da Rua das Flores', type: '🍷 Dinner — Traditional petiscos' },
        ],
      },
      {
        title: 'Day 2 — Sintra Day Trip',
        stops: [
          { time: '08:30', name: 'Train to Sintra', type: '🚂 Transfer — 40 min scenic ride' },
          { time: '10:00', name: 'Pena Palace', type: '🏰 UNESCO — Colorful hilltop palace' },
          { time: '12:00', name: 'Quinta da Regaleira', type: '🌿 Mystery — Initiation well & gardens' },
          { time: '13:30', name: 'Piriquita', type: '🍽️ Lunch — Famous travesseiros pastry' },
          { time: '15:00', name: 'Moorish Castle', type: '🏰 Heritage — Medieval fortress views' },
          { time: '17:30', name: 'Cabo da Roca', type: '🌊 Landmark — Westernmost point of Europe' },
          { time: '20:00', name: 'Cervejaria Ramiro', type: '🦐 Dinner — Legendary seafood in Lisbon' },
        ],
      },
    ],
  },
  {
    id: 'demo-japan',
    destination: 'Tokyo, Japan',
    savedAt: '2026-02-20T09:00:00Z',
    style: 'Food & Culture',
    totalCost: '¥95,000',
    tripOverview: 'From Tsukiji\'s freshest sushi to Shibuya\'s neon lights — Tokyo in all its glory.',
    days: [
      {
        title: 'Day 1 — Traditional Tokyo',
        stops: [
          { time: '07:00', name: 'Tsukiji Outer Market', type: '🍣 Breakfast — Fresh sushi at dawn' },
          { time: '09:30', name: 'Senso-ji Temple', type: '⛩️ Culture — Asakusa\'s ancient temple' },
          { time: '11:30', name: 'Nakamise Shopping Street', type: '🛍️ Shopping — Traditional snacks & souvenirs' },
          { time: '13:00', name: 'Ichiran Ramen', type: '🍜 Lunch — Solo booth tonkotsu ramen' },
          { time: '15:00', name: 'Meiji Shrine', type: '⛩️ Culture — Peaceful forest shrine' },
          { time: '17:00', name: 'Harajuku & Takeshita Street', type: '🎌 Culture — Youth fashion capital' },
          { time: '19:30', name: 'Shibuya Crossing & Dinner', type: '🍻 Dinner — Yakitori under the tracks' },
        ],
      },
      {
        title: 'Day 2 — Modern & Futuristic',
        stops: [
          { time: '09:00', name: 'TeamLab Borderless', type: '🎨 Art — Immersive digital art museum' },
          { time: '11:30', name: 'Odaiba Gundam Statue', type: '📸 Landmark — Life-size Gundam' },
          { time: '13:00', name: 'Toyosu Fish Market', type: '🍽️ Lunch — Tuna auction & sushi' },
          { time: '15:00', name: 'Akihabara Electric Town', type: '🎮 Culture — Anime, manga & arcades' },
          { time: '17:00', name: 'Imperial Palace Gardens', type: '🌳 Walk — Peaceful royal gardens' },
          { time: '19:00', name: 'Shinjuku Golden Gai', type: '🍶 Dinner — 200+ tiny themed bars' },
          { time: '21:00', name: 'Tokyo Tower Night View', type: '🌃 Views — City skyline at night' },
        ],
      },
      {
        title: 'Day 3 — Day Trip to Kamakura',
        stops: [
          { time: '08:00', name: 'Train to Kamakura', type: '🚂 Transfer — 1 hour from Tokyo' },
          { time: '09:30', name: 'Great Buddha (Daibutsu)', type: '🗿 Landmark — 13m bronze statue' },
          { time: '11:00', name: 'Hase-dera Temple', type: '⛩️ Culture — Ocean-view temple & gardens' },
          { time: '12:30', name: 'Komachi-dori Street', type: '🍽️ Lunch — Matcha ice cream & street food' },
          { time: '14:00', name: 'Bamboo Temple (Hokoku-ji)', type: '🎋 Nature — Zen bamboo garden' },
          { time: '16:00', name: 'Enoshima Island', type: '🏝️ Beach — Coastal shrine & caves' },
          { time: '19:00', name: 'Back to Tokyo — Omakase Sushi', type: '🍣 Dinner — Chef\'s choice course' },
        ],
      },
    ],
  },
  {
    id: 'demo-brazil',
    destination: 'Rio de Janeiro, Brazil',
    savedAt: '2026-03-10T11:00:00Z',
    style: 'Adventure',
    totalCost: 'R$4,200',
    tripOverview: 'Samba, sun and spectacular views — from Christ the Redeemer to Copacabana\'s golden sands.',
    days: [
      {
        title: 'Day 1 — Icons of Rio',
        stops: [
          { time: '08:00', name: 'Christ the Redeemer', type: '🗿 Landmark — Corcovado mountain train' },
          { time: '11:00', name: 'Escadaria Selarón', type: '🎨 Art — Colorful mosaic staircase' },
          { time: '12:30', name: 'Santa Teresa Neighborhood', type: '🍽️ Lunch — Bohemian quarter bistro' },
          { time: '14:30', name: 'Sugarloaf Mountain Cable Car', type: '🏔️ Views — Panoramic bay views' },
          { time: '17:00', name: 'Copacabana Beach', type: '🏖️ Beach — Sunset on the iconic shore' },
          { time: '20:00', name: 'Churrascaria Palace', type: '🥩 Dinner — All-you-can-eat Brazilian BBQ' },
        ],
      },
      {
        title: 'Day 2 — Nature & Culture',
        stops: [
          { time: '08:30', name: 'Tijuca National Forest', type: '🌿 Nature — World\'s largest urban forest' },
          { time: '11:00', name: 'Botanical Garden', type: '🌺 Nature — 6,500 species of tropical plants' },
          { time: '13:00', name: 'Ipanema Beach', type: '🍽️ Lunch — Beachside açaí and fresh juice' },
          { time: '15:00', name: 'Maracanã Stadium Tour', type: '⚽ Culture — Legendary football temple' },
          { time: '17:30', name: 'Lapa Arches', type: '🎶 Culture — Live samba at sunset' },
          { time: '20:00', name: 'Rio Scenarium', type: '🍸 Dinner — 3-floor samba club & restaurant' },
        ],
      },
    ],
  },
];

export default function MyTripsPage() {
  const t = useTranslations('myTrips');
  const [visitedCountries, setVisitedCountries] = useState([]);
  const [journeyTrips, setJourneyTrips] = useState([]);

  // Country name to code mapping for destination matching
  const DEST_TO_CODE = {
    'china': '156', 'beijing': '156', 'shanghai': '156',
    'portugal': '620', 'lisbon': '620', 'porto': '620', 'azores': '620',
    'japan': '392', 'tokyo': '392', 'kyoto': '392', 'osaka': '392',
    'france': '250', 'paris': '250', 'spain': '724', 'barcelona': '724', 'madrid': '724',
    'italy': '380', 'rome': '380', 'germany': '276', 'berlin': '276',
    'uk': '826', 'united kingdom': '826', 'london': '826',
    'usa': '840', 'united states': '840', 'new york': '840',
    'brazil': '076', 'india': '356', 'australia': '036',
    'thailand': '764', 'bangkok': '764', 'indonesia': '360', 'bali': '360',
    'turkey': '792', 'istanbul': '792', 'greece': '300', 'athens': '300',
    'mexico': '484', 'egypt': '818', 'morocco': '504', 'south korea': '410',
    'switzerland': '756', 'netherlands': '528', 'amsterdam': '528',
  };

  // Compute planned country codes from trip destinations that aren't visited yet
  const plannedCountryCodes = useMemo(() => {
    const codes = new Set();
    journeyTrips.forEach(trip => {
      if (!trip.destination) return;
      const lower = trip.destination.toLowerCase();
      for (const [name, code] of Object.entries(DEST_TO_CODE)) {
        if (lower.includes(name) && !visitedCountries.includes(code)) {
          codes.add(code);
          break;
        }
      }
    });
    return [...codes];
  }, [journeyTrips, visitedCountries]);

  const journeyStats = useMemo(() => {
    const dayCount = journeyTrips.reduce((sum, trip) => {
      if (Array.isArray(trip.days)) return sum + trip.days.length;
      return sum + (Number(trip.daysCount) || 0);
    }, 0);

    return [
      { label: 'roteiros guardados', value: journeyTrips.length },
      { label: 'países visitados', value: visitedCountries.length },
      { label: 'países planeados', value: plannedCountryCodes.length },
      { label: 'dias organizados', value: dayCount },
    ];
  }, [journeyTrips, plannedCountryCodes.length, visitedCountries.length]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('andor_visited_countries');
    if (stored) {
      try {
        setVisitedCountries(safeParse(stored, []));
      } catch (e) {
        // ignore
      }
    }

    setJourneyTrips(getStoredJourneyTrips());
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('andor_visited_countries', JSON.stringify(visitedCountries));
  }, [visitedCountries]);

  const handleToggleCountry = (code) => {
    setVisitedCountries(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      }
      return [...prev, code];
    });
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.badge}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.badgeIcon}>
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {t('badge')}
            </span>
            <h1 className={styles.title} aria-label="A tua jornada">
              {t('title')} <span className={styles.titleHighlight}>{t('titleHighlight')}</span> {t('titleSuffix')}
            </h1>
            <p className={styles.subtitle}>
              {t('subtitle')}
            </p>
            <div className={styles.heroActions}>
              <Link href="/itineraries" className={styles.primaryAction} data-testid="journey-create-trip">
                Criar viagem
              </Link>
              <a href="#journey-history" className={styles.secondaryAction}>
                Ver roteiros
              </a>
            </div>
          </div>
        </div>

        <section className={styles.statsStrip} aria-label="Resumo da tua jornada">
          {journeyStats.map((stat) => (
            <div className={styles.statCard} key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </section>

        <div className={styles.content}>
          <div className={styles.globeSection}>
            <GlobeTracker visitedCountries={visitedCountries} plannedCountries={plannedCountryCodes} />
          </div>
          <div className={styles.managerSection}>
            <CountryManager
              visitedCountries={visitedCountries}
              onToggleCountry={handleToggleCountry}
              translations={t}
            />
          </div>
        </div>

        <TripHistory
          trips={journeyTrips}
          visitedCountries={visitedCountries}
        />
      </main>
      <Footer />
    </>
  );
}
