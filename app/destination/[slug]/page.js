'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DESTINATIONS = {
  tokyo: {
    name: 'Tokyo',
    country: 'Japan',
    flag: '🇯🇵',
    score: 9.7,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=2000&q=85',
    verdict: 'Tokyo is best when you let it breathe: temple mornings, precise train hops, one excellent counter meal, and neon only after you have earned it.',
    mood: 'Electric, immaculate, quietly tender when you step one street away from the obvious.',
    bestMonths: ['Mar', 'Apr', 'Nov'],
    tripLength: '6-8 days',
    budget: { tier: 'Premium value', daily: '€145-€260', note: 'Rail, casual lunches, and one splurge dinner give the best balance.' },
    weather: {
      May: { label: 'May in Tokyo', icon: '🌤️', stats: '22°C average · 9 rainy days · fresh evenings', tip: 'Bring a light layer and shoes that stay comfortable in sudden showers.' },
      Sep: { label: 'September in Tokyo', icon: '🌦️', stats: '26°C average · 10 rainy days · high humidity', tip: 'Pack breathable clothes, a compact umbrella, and leave indoor swaps for stormy afternoons.' },
    },
    months: {
      Mar: ['96', 'Cherry blossom openings, cool evenings', 'High', 'Book hotels early'],
      Apr: ['94', 'Sakura into fresh spring greens', 'High', 'Pay more, walk more'],
      Nov: ['95', 'Clear skies and autumn gardens', 'Medium', 'Best comfort/price mix'],
      Jun: ['72', 'Rainy season atmosphere', 'Medium', 'Great museum month'],
    },
    highlights: [
      ['Senso-ji before 8am', 'The only time Asakusa feels contemplative instead of crowded.'],
      ['Yanaka Ginza', 'Old Tokyo texture, small shops, cemetery lanes, and gentle pacing.'],
      ['Golden Gai with restraint', 'One tiny bar, one conversation, then leave while it is still magic.'],
    ],
    skipList: [
      ['Robot-themed tourist shows', 'Expensive, loud, and rarely the Tokyo people come back talking about.'],
      ['Takeshita Street at midday', 'Worth a glance early; miserable when shoulder-to-shoulder.'],
      ['Airport taxis', 'Use Narita Express, Skyliner, or Limousine Bus unless luggage or timing truly demands it.'],
    ],
    food: [
      ['Breakfast', 'Onigiri Bongo style shops or a depachika picnic, not a hotel buffet.'],
      ['Lunch', 'A standing soba counter near a station can be the most honest meal of the day.'],
      ['Dinner', 'Reserve one omakase or izakaya counter; let the rest stay casual.'],
    ],
    practical: ['Suica/PASMO in phone wallet', 'Cash still helps for tiny shops', 'Trains beat taxis almost every time', 'Avoid talking loudly on trains'],
    nearby: [
      ['🇯🇵', 'Kamakura', '55 min', '€8-€14', 'temples + coast', '1 day', 'Sea air after Tokyo density.', 'https://images.unsplash.com/photo-1570459027562-4a916cc6113f?auto=format&fit=crop&w=900&q=80'],
      ['🇯🇵', 'Hakone', '90 min', '€25-€45', 'onsen + Fuji views', '1-2 days', 'Best decompression add-on.', 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=900&q=80'],
    ],
  },
  paris: {
    name: 'Paris',
    country: 'France',
    flag: '🇫🇷',
    score: 9.4,
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=2000&q=85',
    verdict: 'Paris rewards appetite and timing. Skip the checklist sprint; choose two neighborhoods a day and let the city do the seducing.',
    mood: 'Cinematic, exacting, occasionally impatient, unforgettable when you move at cafe speed.',
    bestMonths: ['Apr', 'May', 'Sep', 'Oct'],
    tripLength: '4-6 days',
    budget: { tier: 'Comfortably premium', daily: '€170-€310', note: 'Lunch menus and metro passes protect the budget for one exceptional dinner.' },
    weather: {
      May: { label: 'May in Paris', icon: '🌿', stats: '18°C average · 8 rainy days · long evenings', tip: 'Carry a compact trench or light jacket; terraces are best after 18:00.' },
      Sep: { label: 'September in Paris', icon: '☀️', stats: '20°C average · 6 rainy days · golden light', tip: 'Perfect walking weather. Book dinners early because locals return from holidays.' },
    },
    months: {
      Apr: ['92', 'Spring terraces, soft light', 'Medium', 'Strong hotel value'],
      May: ['94', 'Long evenings and gardens', 'High', 'Book dinners early'],
      Sep: ['96', 'Fashion-week energy, perfect walks', 'High', 'Best overall month'],
      Oct: ['90', 'Museums, wine bars, autumn parks', 'Medium', 'Great shoulder value'],
    },
    highlights: [
      ['The Louvre on a late opening', 'Less rushing, better light, and room to actually look.'],
      ['Canal Saint-Martin', 'A better afternoon than another monument queue.'],
      ['Rue des Martyrs breakfast crawl', 'Bakeries, cheese, fruit, coffee, and neighborhood rhythm.'],
    ],
    skipList: [
      ['Restaurants facing major monuments', 'You pay for the view and lose the plate. Walk three streets.'],
      ['Eiffel Tower summit by default', 'Trocadero at sunrise or a Seine walk often feels better.'],
      ['Beauvais airport unless very cheap', 'Transfer pain can erase the savings.'],
    ],
    food: [
      ['Breakfast', 'Boulangerie pastry plus espresso at the counter.'],
      ['Lunch', 'Prix fixe bistro menu; the best value in the city.'],
      ['Dinner', 'Book one neo-bistro and keep the rest spontaneous.'],
    ],
    practical: ['Navigo Easy card', 'Reserve major museums', 'Watch pickpocket zones calmly', 'Say bonjour before any request'],
    nearby: [
      ['🇫🇷', 'Versailles', '45 min', '€8-€12', 'palace + gardens', '1 day', 'Go for the gardens, not only the Hall of Mirrors.', 'https://images.unsplash.com/photo-1591289009723-aef0a1a8a211?auto=format&fit=crop&w=900&q=80'],
      ['🇫🇷', 'Reims', '46 min', '€30-€55', 'champagne houses', '1 day', 'The cleanest luxury day trip from Paris.', 'https://images.unsplash.com/photo-1590075865003-e48bba130d97?auto=format&fit=crop&w=900&q=80'],
    ],
  },
  bali: {
    name: 'Bali',
    country: 'Indonesia',
    flag: '🇮🇩',
    score: 9.1,
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=2000&q=85',
    verdict: 'Bali is not one place. Split the trip, avoid overbuilt corridors, and choose mornings for nature before the roads tighten.',
    mood: 'Lush, ritual-filled, generous, and much better when you stop trying to see every beach.',
    bestMonths: ['May', 'Jun', 'Sep'],
    tripLength: '7-10 days',
    budget: { tier: 'Flexible luxury', daily: '€95-€230', note: 'Drivers and villas are good value; beach clubs quietly inflate the trip.' },
    weather: {
      May: { label: 'May in Bali', icon: '🌤️', stats: '28°C average · 7 rainy days · dry season starts', tip: 'Light clothes, reef-safe sunscreen, and one modest temple layer cover most days.' },
      Sep: { label: 'September in Bali', icon: '☀️', stats: '27°C average · 4 rainy days · lower humidity', tip: 'One of the easiest months: split beach and inland days before traffic builds.' },
    },
    months: {
      May: ['94', 'Dry season begins', 'Medium', 'Excellent value'],
      Jun: ['95', 'Clearer days, calmer roads', 'Medium', 'Best balance'],
      Sep: ['93', 'Dry, warm, less crowded', 'Medium', 'Smart shoulder pick'],
      Dec: ['58', 'Rain and holiday crowds', 'High', 'Only if dates are fixed'],
    },
    highlights: [
      ['Sidemen over another Canggu day', 'Rice fields, quiet stays, and a softer Bali rhythm.'],
      ['Ubud before breakfast', 'Temples and markets feel completely different before tour traffic.'],
      ['Amed for slow water days', 'Snorkeling, black sand, and Mount Agung views without the scene.'],
    ],
    skipList: [
      ['Swing photo factories', 'Usually expensive, staged, and disconnected from place.'],
      ['Trying Ubud, Canggu, Uluwatu in one day', 'Traffic turns the itinerary into a car tour.'],
      ['Unmetered airport taxis', 'Pre-book transfer or use official counters.'],
    ],
    food: [
      ['Breakfast', 'Local kopi and jaje market sweets before resort brunch.'],
      ['Lunch', 'Warung nasi campur; look for busy, clean turnover.'],
      ['Dinner', 'One seafood grill night in Jimbaran or a quiet Ubud tasting menu.'],
    ],
    practical: ['Hire one trusted driver for long days', 'Dress properly for temples', 'Carry small cash', 'Do not overpack transfer days'],
    nearby: [
      ['🇮🇩', 'Nusa Lembongan', '35 min boat', '€18-€35', 'clear water', '2 days', 'Island reset without flying.', 'https://images.unsplash.com/photo-1586500036706-41963de24d8b?auto=format&fit=crop&w=900&q=80'],
      ['🇮🇩', 'Lombok', '35 min flight', '€45-€90', 'wilder beaches', '3 days', 'A quieter sequel if Bali feels too polished.', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'],
    ],
  },
};

export default function DestinationPage() {
  const params = useParams();
  const slug = String(params?.slug || 'paris').toLowerCase();
  const currentMonth = MONTHS[new Date().getMonth()];
  const data = useMemo(() => DESTINATIONS[slug] || null, [slug]);
  const [heroFailed, setHeroFailed] = useState(false);

  if (!data) {
    return (
      <main className={styles.main}>
        <section className={styles.section}>
          <p className={styles.eyebrow}>Conteúdo indisponível</p>
          <h1>Este guia de destino ainda não foi publicado.</h1>
          <p>Não vamos substituir este destino por informação de outra cidade. Podes criar um plano de demonstração e confirmar depois os detalhes em fontes oficiais.</p>
          <Link href="/destinations">Voltar aos destinos</Link>
        </section>
      </main>
    );
  }

  const scorePercent = Math.round(Number(data.score || 0) * 10);
  const monthWeather = data.weather?.[currentMonth] || data.weather?.May || {
    label: `${currentMonth} in ${data.name}`,
    icon: '🌤️',
    stats: 'Mild conditions · variable rain · easy walking pace',
    tip: 'Check the forecast one week out and keep one flexible indoor swap in the plan.',
  };

  return (
    <div className={styles.container}>
      <section className={`${styles.hero} ${heroFailed ? styles.heroFallback : ''}`}>
        {!heroFailed && (
          <img
            className={styles.heroImage}
            src={data.image}
            alt={`${data.name}, ${data.country}`}
            width="2000"
            height="1200"
            decoding="async"
            fetchPriority="high"
            onError={() => setHeroFailed(true)}
          />
        )}
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <div className={styles.scoreBadge} tabIndex={0}>
              <span className={styles.scoreValue}>{data.score}</span>
              <span className={styles.scoreLabel}>Score demonstrativo</span>
              <div className={styles.scorePopover} role="tooltip">
                <strong>Andor Score: {scorePercent}/100 for {currentMonth}</strong>
                <div className={styles.scoreComponents}>
                  <span>☀️ Weather</span><b>{Math.min(99, scorePercent + 1)}/100</b>
                  <small>Comfortable timing for long days outside.</small>
                  <span>👥 Crowds</span><b>{Math.max(78, scorePercent - 8)}/100</b>
                  <small>Manageable with early starts and smart booking.</small>
                  <span>💰 Value</span><b>{Math.max(80, scorePercent - 5)}/100</b>
                  <small>Good balance between flights, hotels, and meals.</small>
                  <span>🎭 Culture</span><b>{Math.min(99, scorePercent + 2)}/100</b>
                  <small>Strong local rhythm, events, and neighborhood depth.</small>
                </div>
              </div>
            </div>
            <p className={styles.kicker}>{data.flag} {data.country} · suggested {data.tripLength}</p>
            <h1 className={styles.title}>{data.name}</h1>
            <p className={styles.verdict}>{data.verdict}</p>
            <p className={styles.mood}>{data.mood}</p>
          </div>
        </div>
      </section>

      <main className={styles.main}>
        <div className={styles.editorialNotice} role="note">
          Guia editorial de demonstração. Scores, clima, preços e recomendações não são dados ao vivo; confirma tudo o que possa mudar em fontes oficiais.
        </div>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Timing intelligence</p>
            <h2>Best Time Calendar</h2>
          </div>
          <div className={styles.calendar}>
            {MONTHS.map((month) => {
              const monthData = data.months[month] || ['68', 'Usable, but less distinctive', 'Medium', 'Check flights before committing'];
              return (
                <button
                  key={month}
                  type="button"
                  className={`${styles.month} ${data.bestMonths.includes(month) ? styles.monthBest : ''} ${currentMonth === month ? styles.monthCurrent : ''}`}
                  title={`Score ${monthData[0]}. ${monthData[1]}. Crowds: ${monthData[2]}. ${monthData[3]}.`}
                >
                  <span>{month}</span>
                  <strong>{monthData[0]}</strong>
                </button>
              );
            })}
          </div>
          <div className={styles.weatherWidget}>
            <span className={styles.weatherIcon}>{monthWeather.icon}</span>
            <div>
              <p className={styles.weatherTitle}>{monthWeather.label}</p>
              <p className={styles.weatherStats}>{monthWeather.stats}</p>
              <p>{monthWeather.tip}</p>
            </div>
          </div>
        </section>

        <div className={styles.grid2}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <p className={styles.eyebrow}>What is worth it</p>
              <h2>Signature Moves</h2>
            </div>
            <ul className={styles.featureList}>
              {data.highlights.map(([title, desc]) => (
                <li key={title} className={styles.featureItem}>
                  <span className={styles.featureIcon}>✦</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <p className={styles.eyebrow}>Trust builder</p>
              <h2>Honest Skip List</h2>
            </div>
            <ul className={styles.featureList}>
              {data.skipList.map(([title, reason]) => (
                <li key={title} className={styles.skipItem}>
                  <span className={styles.featureIcon}>!</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className={styles.grid2}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <p className={styles.eyebrow}>Food intelligence</p>
              <h2>Eat Like The Trip Matters</h2>
            </div>
            <div className={styles.foodGrid}>
              {data.food.map(([meal, note]) => (
                <article key={meal} className={styles.foodCard}>
                  <span>{meal}</span>
                  <p>{note}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <p className={styles.eyebrow}>Budget and practicals</p>
              <h2>Before You Book</h2>
            </div>
            <div className={styles.budgetCard}>
              <div className={styles.budgetMain}>
                <span className={styles.budgetCategory}>{data.budget.tier}</span>
                <span className={styles.budgetDaily}>{data.budget.daily}<small>/day</small></span>
              </div>
              <p>{data.budget.note}</p>
              <div className={styles.practicalGrid}>
                {data.practical.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Add-on escapes</p>
            <h2>Nearby Escapes</h2>
          </div>
          <div className={styles.nearbyGrid}>
            {data.nearby.map(([flag, name, distance, cost, idealFor, days, reason, image]) => (
              <article key={name} className={styles.nearbyCard}>
                <img
                  src={image}
                  alt={name}
                  width="600"
                  height="420"
                  loading="lazy"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.style.opacity = '0';
                  }}
                />
                <div>
                  <h3>{flag} {name}</h3>
                  <p>{reason}</p>
                  <dl>
                    <div><dt>Distance</dt><dd>{distance}</dd></div>
                    <div><dt>Transport</dt><dd>{cost}</dd></div>
                    <div><dt>Ideal for</dt><dd>{idealFor}</dd></div>
                    <div><dt>Add</dt><dd>{days}</dd></div>
                  </dl>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <div className={styles.stickyCta}>
        <div className={styles.ctaContent}>
          <div>
            <div className={styles.ctaTitle}>Ready for {data.name}?</div>
            <div className={styles.ctaSub}>Build a mobile itinerary with real routes and honest tradeoffs.</div>
          </div>
          <Link href={`/?destination=${encodeURIComponent(data.name)}`} className={styles.ctaButton}>
            Plan My Trip
          </Link>
        </div>
      </div>
    </div>
  );
}
