'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getItinerary } from '../../lib/itinerary-store';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import LiveMap from '../../components/LiveMap';
import styles from './itinerary.module.css';

export default function ItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const { user, saveTrip } = useAuth();
  const [itinerary, setItinerary] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);
  const [showAdaptInput, setShowAdaptInput] = useState(false);
  const [adaptContext, setAdaptContext] = useState('');
  const [convAmount, setConvAmount] = useState(1);

  useEffect(() => {
    const data = getItinerary(params.id);
    if (data) {
      setItinerary(data);
    }
    setLoading(false);
  }, [params.id]);

  const handleSave = () => {
    if (!user) {
      window.dispatchEvent(new Event('open-auth-modal'));
      return;
    }
    saveTrip(itinerary);
    setSaved(true);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } catch {
      alert('Share this link: ' + window.location.href);
    }
  };

  const handleAdapt = async () => {
    if (!adaptContext) return;
    setIsAdapting(true);
    setShowAdaptInput(false);

    try {
      const response = await fetch('/api/adapt-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itinerary,
          activeDayIndex: activeDay,
          context: adaptContext
        })
      });

      if (!response.ok) throw new Error('Adaptation failed');
      const newDay = await response.json();
      
      const newItinerary = { ...itinerary };
      newItinerary.days[activeDay] = newDay;
      setItinerary(newItinerary);
      setAdaptContext('');
    } catch (error) {
      console.error(error);
      alert('Failed to adapt itinerary. Please try again.');
    } finally {
      setIsAdapting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.loadingPage}>
          <div className={styles.spinner}></div>
          <p>Loading itinerary...</p>
        </div>
      </>
    );
  }

  if (!itinerary) {
    return (
      <>
        <Navbar />
        <div className={styles.notFound}>
          <div className={styles.notFoundIcon}>🗺️</div>
          <h2>Itinerary not found</h2>
          <p>This itinerary doesn't exist or has expired.</p>
          <button className="btn btn-primary" onClick={() => router.push('/#planner')}>
            Create Your Own
          </button>
        </div>
      </>
    );
  }

  const currentDay = itinerary.days?.[activeDay];

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        {/* Hero */}
        <div className={styles.hero}>
          {itinerary.image && (
            <div className={styles.heroBg} style={{ backgroundImage: `url(${itinerary.image})` }}></div>
          )}
          <div className={styles.heroOverlay}></div>
          <div className={styles.heroContent}>
            <button className={styles.backBtn} onClick={() => router.back()}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 10H5M5 10L10 5M5 10L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back
            </button>
            <div className={styles.heroInfo}>
              {itinerary.badge && <span className={styles.heroBadge}>{itinerary.badge}</span>}
              <h1 className={styles.heroTitle}>{itinerary.title || `📍 ${itinerary.destination}`}</h1>
              {itinerary.description && <p className={styles.heroDesc}>{itinerary.description}</p>}
              <div className={styles.heroMeta}>
                <span className={styles.metaItem}>📍 {itinerary.destination}</span>
                <span className={styles.metaItem}>📅 {itinerary.days?.length || 0} days</span>
                {itinerary.totalCost && <span className={styles.metaItem}>💰 {itinerary.totalCost}</span>}
                {itinerary.style && <span className={styles.metaItem}>✨ {itinerary.style}</span>}
              </div>
              {itinerary.author && (
                <div className={styles.heroAuthor}>
                  <div className={styles.authorAvatar}>{itinerary.author.avatar || itinerary.author.flag}</div>
                  <span>Created by <strong>{itinerary.author.name}</strong></span>
                  {itinerary.likes && <span className={styles.authorStat}>❤️ {itinerary.likes}</span>}
                  {itinerary.saves && <span className={styles.authorStat}>📌 {itinerary.saves}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Travel Bar */}
        <div className={styles.travelBar}>
          <div className={styles.barItem}>
            <span className={styles.barIcon}>🕒</span>
            <div className={styles.barInfo}>
              <div className={styles.barLabel}>Local Time</div>
              <div className={styles.barValue}>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
          <div className={styles.barItem}>
            <span className={styles.barIcon}>☀️</span>
            <div className={styles.barInfo}>
              <div className={styles.barLabel}>Weather</div>
              <div className={styles.barValue}>24°C • Sunny</div>
            </div>
          </div>
          <div className={styles.barItem}>
            <span className={styles.barIcon}>💱</span>
            <div className={styles.barInfo}>
              <div className={styles.barLabel}>Currency</div>
              <div className={styles.barValue}>1 EUR = 1.08 USD</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Day Tabs */}
          <div className={styles.dayTabs}>
            {itinerary.days?.map((day, i) => (
              <button
                key={i}
                className={`${styles.dayTab} ${activeDay === i ? styles.dayTabActive : ''}`}
                onClick={() => setActiveDay(i)}
              >
                <div className={styles.dayTabLabel}>
                  <span className={styles.dayTabNum}>Day {i + 1}</span>
                  {isLiveMode && i === activeDay && <span className={styles.liveIndicator}>LIVE</span>}
                </div>
                <span className={styles.dayTabTitle}>{day.title?.replace(/Day \d+ — /, '') || `Day ${i + 1}`}</span>
              </button>
            ))}
          </div>

          {/* Live Map Preview */}
          <div className={styles.mapSection}>
            <LiveMap stops={currentDay?.stops || []} />
          </div>

          {/* Main Content */}
          <div className={styles.mainGrid}>
            {/* Timeline */}
            <div className={styles.timeline}>
              <div className={styles.timelineHeader}>
                <h2 className={styles.dayHeading}>{currentDay?.title}</h2>
                <div className={styles.liveControls}>
                  {currentDay?.transportTip && <span className={styles.transportTip}>🚐 {currentDay.transportTip}</span>}
                  <button 
                    className={`${styles.liveToggle} ${isLiveMode ? styles.liveToggleActive : ''}`}
                    onClick={() => setIsLiveMode(!isLiveMode)}
                  >
                    {isLiveMode ? '🛰️ Live Mode On' : '🛰️ Go Live'}
                  </button>
                </div>
              </div>

              {isLiveMode && (
                <div className={styles.liveStatus}>
                  <div className={styles.livePulse}></div>
                  <span>Tracking your journey in real-time</span>
                  <button 
                    className={styles.adaptBtn}
                    onClick={() => setShowAdaptInput(true)}
                    disabled={isAdapting}
                  >
                    {isAdapting ? 'Magic in progress...' : '✨ Magic Adapt'}
                  </button>
                </div>
              )}

              {showAdaptInput && (
                <div className={styles.adaptInputArea}>
                  <input 
                    type="text" 
                    placeholder="What changed? (e.g. 'It started raining', 'I am tired')"
                    value={adaptContext}
                    onChange={(e) => setAdaptContext(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdapt()}
                    autoFocus
                  />
                  <div className={styles.adaptActions}>
                    <button onClick={() => setShowAdaptInput(false)}>Cancel</button>
                    <button className={styles.confirmAdapt} onClick={handleAdapt}>Adapt Now</button>
                  </div>
                </div>
              )}

              <div className={styles.stops}>
                {currentDay?.stops?.map((stop, i) => (
                  <div key={i} className={`${styles.stop} ${isLiveMode && i === 0 ? styles.stopCurrent : ''}`}>
                    <div className={styles.stopTimeline}>
                      <div className={`${styles.stopDot} ${i === 0 ? styles.stopDotFirst : ''}`}></div>
                      {i < currentDay.stops.length - 1 && <div className={styles.stopLine}></div>}
                    </div>
                    <div className={styles.stopCard}>
                      <div className={styles.stopTime}>
                        {stop.time}
                        {isLiveMode && i === 0 && <span className={styles.nowLabel}>NOW</span>}
                      </div>
                      <div className={styles.stopInfo}>
                        <h3 className={styles.stopName}>{stop.name}</h3>
                        <p className={styles.stopType}>{stop.type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className={styles.sidebar}>
              <div className={styles.summaryCard}>
                <h3 className={styles.summaryTitle}>Trip Summary</h3>
                <div className={styles.summaryList}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Destination</span>
                    <span className={styles.summaryValue}>{itinerary.destination}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Duration</span>
                    <span className={styles.summaryValue}>{itinerary.days?.length} days</span>
                  </div>
                  {itinerary.totalCost && (
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Estimated Cost</span>
                      <span className={`${styles.summaryValue} ${styles.summaryHighlight}`}>{itinerary.totalCost}</span>
                    </div>
                  )}
                  {itinerary.style && (
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Style</span>
                      <span className={styles.summaryValue}>{itinerary.style}</span>
                    </div>
                  )}
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Stops</span>
                    <span className={styles.summaryValue}>
                      {itinerary.days?.reduce((acc, d) => acc + (d.stops?.length || 0), 0)} total
                    </span>
                  </div>
                </div>
                <div className={styles.summaryActions}>
                  <button
                    className={`${styles.saveBtn} ${saved ? styles.saveBtnSaved : ''}`}
                    onClick={handleSave}
                    disabled={saved}
                  >
                    {saved ? '✓ Saved to Dashboard' : user ? '📌 Save Itinerary' : '📌 Save Itinerary'}
                  </button>
                  <button className={styles.shareBtn} onClick={handleShare}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8V12C4 12.5523 4.44772 13 5 13H11C11.5523 13 12 12.5523 12 12V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 2V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M5.5 4.5L8 2L10.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Share
                  </button>
                  <button className={styles.printBtn} onClick={() => window.print()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    Print PDF
                  </button>
                </div>
              </div>

              {/* Agency Recommendations */}
              {(itinerary.flights || itinerary.accommodation) && (
                <div className={styles.agencyCard}>
                  <h3 className={styles.agencyTitle}>🏢 Agency Recommendations</h3>
                  
                  {itinerary.flights && (
                    <div className={styles.agencyItem}>
                      <div className={styles.agencyIcon}>✈️</div>
                      <div className={styles.agencyInfo}>
                        <div className={styles.agencyLabel}>Flight Suggestion</div>
                        <div className={styles.agencyValue}>{itinerary.flights.suggestion}</div>
                        <div className={styles.agencySub}>{itinerary.flights.averagePrice} avg.</div>
                      </div>
                    </div>
                  )}

                  {itinerary.accommodation && (
                    <div className={styles.agencyItem}>
                      <div className={styles.agencyIcon}>🏨</div>
                      <div className={styles.agencyInfo}>
                        <div className={styles.agencyLabel}>Recommended Stay</div>
                        <div className={styles.agencyValue}>{itinerary.accommodation.hotelName}</div>
                        <div className={styles.agencySub}>{itinerary.accommodation.type} — {itinerary.accommodation.reason}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Must Eat Section */}
              {itinerary.mustEat && (
                <div className={styles.mustEatCard}>
                  <h3 className={styles.agencyTitle}>🍽️ Cannot Miss (Dining)</h3>
                  <ul className={styles.mustEatList}>
                    {itinerary.mustEat.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Safety & Contingency */}
              {itinerary.contingency && (
                <div className={styles.contingencyCard}>
                  <h3 className={styles.agencyTitle}>🛡️ Safety & Contingency</h3>
                  <div className={styles.contingencyItem}>
                    <strong>Emergency:</strong> {itinerary.contingency.emergencyInfo}
                  </div>
                  <div className={styles.contingencyItem}>
                    <strong>Tips:</strong> {itinerary.contingency.unexpectedTips}
                  </div>
                </div>
              )}

              {/* AI Badge */}
              <div className={styles.aiBadge}>
                <div className={styles.aiBadgeIcon}>🧠</div>
                <div>
                  <div className={styles.aiBadgeTitle}>AI-Optimized Route</div>
                  <div className={styles.aiBadgeDesc}>Stops ordered for minimal travel time and maximum experience.</div>
                </div>
              </div>

              {/* Currency Widget */}
              <div className={styles.currencyWidget}>
                <h4 className={styles.agencyTitle}>💱 Quick Convert</h4>
                <div className={styles.converterRow}>
                  <input 
                    type="number" 
                    value={convAmount} 
                    onChange={(e) => setConvAmount(e.target.value)}
                    className={styles.convInput} 
                  />
                  <span className={styles.convLabel}>EUR</span>
                  <span className={styles.convArrow}>→</span>
                  <span className={styles.convResult}>{(convAmount * 1.08).toFixed(2)}</span>
                  <span className={styles.convLabel}>USD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
