'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { saveGeneratedItinerary } from '../lib/itinerary-store';
import styles from './ItineraryGenerator.module.css';

const styleOptions = [
  { id: 'cultural', label: 'Cultural', icon: '🏛️', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=600' },
  { id: 'adventure', label: 'Adventure', icon: '🌋', img: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=600' },
  { id: 'luxury', label: 'Elite', icon: '💎', img: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=600' },
  { id: 'budget', label: 'Tactical', icon: '🎒', img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600' }
];

const interestTags = ['Photography', 'Food & Culinary', 'Nightlife', 'History', 'Nature & Wildlife', 'Architecture', 'Shopping', 'Hidden Gems'];

const generateMockItinerary = (dest, numDays, pace, squad) => {
  const destination = dest || 'Unknown Target';
  const days = [];
  const activities = [
    { name: `Recon: ${destination} Central District`, type: '📍' },
    { name: `Local Culinary Intelligence`, type: '🍽️' },
    { name: `Historical Archives Tour`, type: '🏛️' },
    { name: `High-Altitude Viewpoint`, type: '⛰️' },
    { name: `Underground Transit Navigation`, type: '🚇' },
    { name: `Night Ops & Social Infiltration`, type: '🍸' },
    { name: `Covert Photography Walk`, type: '📷' },
    { name: `Local Market Asset Extraction`, type: '🛍️' },
  ];

  let stopsPerDay = 3;
  if (pace === 'intensive') stopsPerDay = 5;
  if (pace === 'relaxed') stopsPerDay = 2;

  for (let i = 1; i <= parseInt(numDays); i++) {
    const stops = [];
    let startHour = 8;
    for (let j = 0; j < stopsPerDay; j++) {
      const timeStr = `${startHour.toString().padStart(2, '0')}:00`;
      stops.push({ time: timeStr, name: activities[Math.floor(Math.random() * activities.length)].name, type: 'Operation' });
      startHour += Math.floor(12 / stopsPerDay);
    }
    
    days.push({
      title: `Day ${i} — Sector Alpha`,
      stops: stops,
    });
  }

  let costBase = 150;
  if (squad === 'duo') costBase = 250;
  if (squad === 'squad') costBase = 500;

  return {
    destination: destination,
    days: days,
    totalCost: `€${Math.floor(Math.random() * costBase) + costBase}`,
  };
};

const loadingMessages = [
  "Establishing secure uplink...",
  "Analyzing topological data...",
  "Filtering high-value targets...",
  "Compiling mission vectors...",
  "Deployment plan ready."
];

export default function ItineraryGenerator() {
  const { user, saveTrip } = useAuth();
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('3');
  const [style, setStyle] = useState('cultural');
  const [squad, setSquad] = useState('solo');
  const [pace, setPace] = useState('moderate');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [includeFlights, setIncludeFlights] = useState(false);
  const [includeAccommodation, setIncludeAccommodation] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [loadMsgIdx, setLoadMsgIdx] = useState(0);
  const [result, setResult] = useState(null);

  const toggleInterest = (tag) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter(t => t !== tag));
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const handleGenerate = async () => {
    if (!destination) return;
    setLoading(true);
    setResult(null);
    setLoadMsgIdx(0);

    const interval = setInterval(() => {
      setLoadMsgIdx(prev => {
        if (prev < loadingMessages.length - 1) return prev + 1;
        return prev;
      });
    }, 600);

    // Simulate elite AI agency reasoning
    await new Promise(r => setTimeout(r, 3000));
    clearInterval(interval);

    try {
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, days, style, squad, pace, interests: selectedInterests, includeFlights, includeAccommodation })
      });
      
      let data = response.ok ? await response.json() : generateMockItinerary(destination, days, pace, squad);
      const id = saveGeneratedItinerary(data);
      const finalResult = { ...data, id };
      setResult(finalResult);
      if (user) saveTrip(finalResult);
    } catch (error) {
      const data = generateMockItinerary(destination, days, pace, squad);
      setResult({ ...data, id: saveGeneratedItinerary(data) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.planner} id="planner">
      <div className={styles.plannerOverlay}></div>
      
      <div className={styles.container}>
        <div className={styles.formSide}>
          <span className={styles.label}>Agency Service</span>
          <h2 className={styles.title}>Where are we <span className="gradient-text">deploying?</span></h2>

          <div className={styles.inputBox}>
            <label className={styles.label}>Destination Vector</label>
            <input 
              type="text" 
              className={styles.mainInput} 
              placeholder="e.g. Kyoto, Japan" 
              value={destination}
              onChange={e => setDestination(e.target.value)}
              spellCheck="false"
            />
          </div>

          <div className={styles.grid2Col}>
            <div className={styles.configGroup}>
              <label className={styles.label}>Mission Duration</label>
              <div className={styles.segmentedControl}>
                {['1', '3', '5', '7', '14'].map(d => (
                  <button 
                    key={d} 
                    className={`${styles.segment} ${days === d ? styles.activeSegment : ''}`}
                    onClick={() => setDays(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.configGroup}>
              <label className={styles.label}>Squad Size</label>
              <div className={styles.segmentedControl}>
                {['solo', 'duo', 'squad'].map(s => (
                  <button 
                    key={s} 
                    className={`${styles.segment} ${squad === s ? styles.activeSegment : ''}`}
                    onClick={() => setSquad(s)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.configGroup}>
            <label className={styles.label}>Mission Pace</label>
            <div className={styles.segmentedControl}>
              {['relaxed', 'moderate', 'intensive'].map(p => (
                <button 
                  key={p} 
                  className={`${styles.segment} ${pace === p ? styles.activeSegment : ''}`}
                  onClick={() => setPace(p)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.configGroup}>
            <label className={styles.label}>Travel Style</label>
            <div className={styles.styleGrid}>
              {styleOptions.map(s => (
                <div 
                  key={s.id} 
                  className={`${styles.styleCard} ${style === s.id ? styles.activeStyle : ''}`}
                  onClick={() => setStyle(s.id)}
                >
                  <img src={s.img} alt={s.label} className={styles.styleBg} />
                  <div className={styles.styleContent}>
                    <span className={styles.styleIcon}>{s.icon}</span>
                    <span className={styles.styleLabel}>{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.configGroup}>
            <label className={styles.label}>Specific Interests (Optional)</label>
            <div className={styles.tagsContainer}>
              {interestTags.map(tag => (
                <button 
                  key={tag}
                  className={`${styles.interestTag} ${selectedInterests.includes(tag) ? styles.activeInterest : ''}`}
                  onClick={() => toggleInterest(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.grid2Col}>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={includeFlights} onChange={e => setIncludeFlights(e.target.checked)} />
                <span className={styles.customCheck}></span>
                Include Flights Intel
              </label>
            </div>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={includeAccommodation} onChange={e => setIncludeAccommodation(e.target.checked)} />
                <span className={styles.customCheck}></span>
                Include Accommodation
              </label>
            </div>
          </div>

          <button className={styles.generateBtn} onClick={handleGenerate} disabled={loading}>
            {loading ? 'Initializing...' : 'Deploy Mission'}
          </button>
        </div>

        <div className={styles.resultSide}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.loaderTerminal}>
                <div className={styles.terminalHeader}>
                  <div className={styles.terminalDots}>
                    <span></span><span></span><span></span>
                  </div>
                  ANDOR.SYS // ORCHESTRATOR
                </div>
                <div className={styles.terminalBody}>
                  {loadingMessages.slice(0, loadMsgIdx + 1).map((msg, i) => (
                    <div key={i} className={styles.terminalLine}>
                      <span className={styles.terminalPrompt}>{'> '}</span>
                      {msg}
                    </div>
                  ))}
                  <div className={styles.terminalCursor}></div>
                </div>
              </div>
            </div>
          ) : result ? (
            <div className={styles.itineraryCard}>
              <div className={styles.resultHeader}>
                <h3>{result.destination}</h3>
                <span className={styles.costBadge}>{result.totalCost}</span>
              </div>
              <div className={styles.daysList}>
                {(result.flights && includeFlights) && (
                  <div className={styles.logisticsCard}>
                    <div className={styles.logisticsTitle}>✈️ Flight Intelligence</div>
                    <div className={styles.logisticsRow}>
                      <p>{result.flights.suggestion}</p>
                      <span className={styles.logisticsPrice}>{result.flights.averagePrice}</span>
                    </div>
                  </div>
                )}
                
                {(result.accommodation && includeAccommodation) && (
                  <div className={styles.logisticsCard}>
                    <div className={styles.logisticsTitle}>🏨 Basecamp: {result.accommodation.hotelName} ({result.accommodation.type})</div>
                    <div className={styles.logisticsRow}>
                      <p>{result.accommodation.reason}</p>
                      {result.accommodation.pricePerNight && <span className={styles.logisticsPrice}>{result.accommodation.pricePerNight}/night</span>}
                    </div>
                  </div>
                )}

                {result.days.map((day, idx) => (
                  <div key={idx} className={styles.dayItem}>
                    <h4 className={styles.dayTitle}>{day.title}</h4>
                    {day.transportTip && <div className={styles.transitTip}>🚗 {day.transportTip}</div>}
                    
                    {day.stops.map((stop, sIdx) => (
                      <div key={sIdx} className={styles.stopCard}>
                        {stop.imageKeyword && (
                          <img 
                            src={`https://image.pollinations.ai/prompt/${stop.imageKeyword}?width=600&height=400&nologo=true`} 
                            alt={stop.name} 
                            className={styles.stopImage} 
                          />
                        )}
                        <div className={styles.stopContent}>
                          <div className={styles.stopHeader}>
                            <span className={styles.time}>{stop.time}</span>
                            <span className={styles.stopName}>{stop.name}</span>
                          </div>
                          <div className={styles.stopType}>{stop.type}</div>
                          
                          {stop.transitToNext && <div className={styles.transitTip}>🧭 {stop.transitToNext}</div>}
                          
                          {stop.alternatives && stop.alternatives.length > 0 && (
                            <div className={styles.alternatives}>
                              <strong>{stop.isRestaurant ? 'Alternative Food Spots:' : 'Alternatives:'}</strong>
                              <ul>
                                {stop.alternatives.map((alt, aIdx) => <li key={aIdx}>{alt}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.hologram}></div>
              <p style={{color: 'rgba(0,255,200,0.6)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em'}}>Awaiting Strategic Input</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
