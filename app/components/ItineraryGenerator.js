'use client';
import { useState } from 'react';
import styles from './ItineraryGenerator.module.css';

const interests = ['History', 'Nature', 'Architecture', 'Shopping', 'Food', 'Nightlife', 'Art', 'Photography', 'Beach', 'Adventure'];

const sampleItinerary = {
  destination: 'Lisbon, Portugal',
  days: [
    {
      title: 'Day 1 — Historic Heart',
      stops: [
        { time: '09:00', name: 'Pastéis de Belém', type: '☕ Breakfast — Famous pastéis de nata' },
        { time: '10:30', name: 'Jerónimos Monastery', type: '🏛️ UNESCO Heritage Site' },
        { time: '13:00', name: 'Time Out Market', type: '🍽️ Lunch — Gourmet food hall' },
        { time: '15:00', name: 'Alfama District Walk', type: '🚶 Cultural — Oldest neighborhood' },
        { time: '17:00', name: 'Miradouro da Graça', type: '🌅 Viewpoint — Sunset panorama' },
        { time: '20:00', name: 'Taberna da Rua das Flores', type: '🍷 Dinner — Traditional Portuguese' },
      ],
    },
    {
      title: 'Day 2 — Coast & Culture',
      stops: [
        { time: '08:30', name: 'Café A Brasileira', type: '☕ Breakfast — Historic café in Chiado' },
        { time: '10:00', name: 'Tram 28 Ride', type: '🚋 Experience — Iconic tram route' },
        { time: '12:00', name: 'São Jorge Castle', type: '🏰 Heritage — Moorish castle' },
        { time: '14:00', name: 'Cervejaria Ramiro', type: '🦐 Lunch — Best seafood in Lisbon' },
        { time: '16:00', name: 'LX Factory', type: '🎨 Creative hub — Art & shops' },
        { time: '19:30', name: 'Fado in Alfama', type: '🎵 Music — Traditional Fado show' },
      ],
    },
  ],
  totalCost: '€178',
};

export default function ItineraryGenerator() {
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState('');
  const [style, setStyle] = useState('cultural');
  const [activeInterests, setActiveInterests] = useState(['History', 'Food', 'Architecture']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = () => {
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setLoading(false);
      setResult(sampleItinerary);
    }, 2500);
  };

  const toggleInterest = (interest) => {
    setActiveInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <section className={styles.planner} id="planner">
      <div className={styles.header}>
        <span className="section-label">🧠 AI Planner</span>
        <h2 className="section-title">Generate your perfect itinerary</h2>
        <p className="section-subtitle mx-auto">
          Tell us about your trip and our AI will create an optimized, personalized plan in seconds.
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.formSide}>
          <div className={styles.formCard}>
            <h3 className={styles.formTitle}>✈️ Trip Details</h3>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Destination</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="e.g. Lisbon, Portugal"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Budget (total)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. €200"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Duration</label>
                <select className={styles.formSelect} defaultValue="2">
                  <option value="1">1 day</option>
                  <option value="2">2 days</option>
                  <option value="3">3 days</option>
                  <option value="5">5 days</option>
                  <option value="7">1 week</option>
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Travel Style</label>
                <select className={styles.formSelect} value={style} onChange={(e) => setStyle(e.target.value)}>
                  <option value="cultural">Cultural</option>
                  <option value="adventure">Adventure</option>
                  <option value="luxury">Luxury</option>
                  <option value="budget">Budget</option>
                  <option value="nightlife">Nightlife</option>
                  <option value="romantic">Romantic</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Travelers</label>
                <select className={styles.formSelect} defaultValue="2">
                  <option value="1">1 person</option>
                  <option value="2">2 people</option>
                  <option value="3">3 people</option>
                  <option value="4">4 people</option>
                  <option value="5+">5+ group</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Interests</label>
              <div className={styles.tags}>
                {interests.map(interest => (
                  <button
                    key={interest}
                    className={`${styles.tag} ${activeInterests.includes(interest) ? styles.tagActive : ''}`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <button className={styles.generateBtn} onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <>Generating...</>
              ) : (
                <>
                  Generate Itinerary
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 3L10 17M10 3L5 8M10 3L15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(90 10 10)"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        <div className={styles.resultSide}>
          {!loading && !result && (
            <div className={styles.placeholder}>
              <div className={styles.placeholderIcon}>🌍</div>
              <div className={styles.placeholderText}>Your itinerary will appear here</div>
              <div className={styles.placeholderSub}>Fill in your trip details and click generate</div>
            </div>
          )}

          {loading && (
            <div className={styles.loader}>
              <div className={styles.spinner}></div>
              <div className={styles.loaderText}>AI is crafting your perfect trip...</div>
            </div>
          )}

          {result && (
            <div className={styles.resultCard}>
              <div className={styles.resultHeader}>
                <h3 className={styles.resultTitle}>📍 {result.destination}</h3>
                <span className={styles.resultBadge}>✓ AI Optimized</span>
              </div>

              {result.days.map((day, di) => (
                <div key={di} className={styles.daySection}>
                  <h4 className={styles.dayTitle}>
                    <span className={styles.dayDot}></span>
                    {day.title}
                  </h4>
                  {day.stops.map((stop, si) => (
                    <div key={si} className={styles.stop}>
                      <span className={styles.stopTime}>{stop.time}</span>
                      <div className={styles.stopInfo}>
                        <div className={styles.stopName}>{stop.name}</div>
                        <div className={styles.stopType}>{stop.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <div className={styles.resultFooter}>
                <div className={styles.totalCost}>
                  <span className={styles.costLabel}>Estimated Total</span>
                  <span className={styles.costValue}>{result.totalCost}</span>
                </div>
                <button className="btn btn-primary">
                  Save Itinerary
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
