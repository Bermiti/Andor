'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './Social.module.css';
import { safeParse } from '../lib/safe-json';
import { useDebounce } from '../lib/useDebounce';

const tabs = ['🔥 Trending', '⭐ Top Rated', '🆕 New', '💰 Budget', '🌍 Europe', '🌏 Asia', '🗽 Americas'];

export const itineraries = [
  {
    slug: 'hidden-gems-lisbon',
    title: 'Hidden Gems of Lisbon',
    desc: '3-day cultural deep dive into Lisbon\'s lesser-known neighborhoods, local markets, and secret viewpoints.',
    badge: '🔥 Trending',
    image: 'https://images.unsplash.com/photo-1548705085-101177834f47?q=80&w=600&auto=format&fit=crop',
    author: '🇵🇹', authorName: 'Maria S.', likes: '2.4K', saves: '890', price: '€4.99', oldPrice: '€9.99', discount: '50% OFF', days: '3 days',
    categories: ['🔥 Trending', '🌍 Europe'],
    budgetVal: 285,
    climate: 'temperate',
    type: 'culture',
    spotsRemaining: 3,
    destination: 'Lisbon, Portugal',
    highlights: ['Secret Alfama walking tour', 'LX Factory street art', 'Belém riverside walk'],
    mustEat: 'Pastéis de Nata, O Velho Eurico petiscos',
    style: 'Cultural'
  },
  {
    slug: 'barcelona-budget',
    title: 'Barcelona on a Budget',
    desc: 'Experience the best of Barcelona for under €50/day — free attractions, cheap eats, and local secrets.',
    badge: '⭐ Top Rated',
    image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?q=80&w=600&auto=format&fit=crop',
    author: '🇪🇸', authorName: 'Carlos R.', likes: '1.8K', saves: '654', price: 'Free', days: '5 days',
    categories: ['⭐ Top Rated', '💰 Budget', '🌍 Europe'],
    budgetVal: 245,
    climate: 'temperate',
    type: 'culture',
    spotsRemaining: 5,
    destination: 'Barcelona, Spain',
    highlights: ['Free walking tour', 'Ciutadella park relaxation', 'Magic Fountain show'],
    mustEat: 'Bo de B sandwich, fresh Boqueria juices',
    style: 'Budget'
  },
  {
    slug: 'romantic-paris',
    title: 'Romantic Paris Weekend',
    desc: 'The ultimate couple\'s guide — candlelit dinners, Seine river walks, and the most intimate spots in Paris.',
    badge: '💕 Popular',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=600&auto=format&fit=crop',
    author: '🇫🇷', authorName: 'Sophie L.', likes: '3.1K', saves: '1.2K', price: '€5.99', oldPrice: '€11.99', discount: '50% OFF', days: '2 days',
    categories: ['🔥 Trending', '🌍 Europe'],
    budgetVal: 420,
    climate: 'temperate',
    type: 'romance',
    spotsRemaining: 2,
    destination: 'Paris, France',
    highlights: ['Seine River cruise', 'Eiffel Tower at night', 'Montmartre sunset walk'],
    mustEat: 'Pink Mamma pasta, Café de Flore pastries',
    style: 'Romantic'
  },
  {
    slug: 'swiss-alps-train',
    title: 'Swiss Alps Train Journey',
    desc: 'Glacier Express route and the most scenic mountain views in Switzerland.',
    badge: '🚂 Scenic',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=600&auto=format&fit=crop',
    author: '🇨🇭', authorName: 'Heidi L.', likes: '1.9K', saves: '800', price: '€12.99', oldPrice: '€24.99', discount: '48% OFF', days: '5 days',
    categories: ['⭐ Top Rated', '🌍 Europe', '🆕 New'],
    budgetVal: 1200,
    climate: 'cold',
    type: 'adventure',
    spotsRemaining: 4,
    destination: 'Valais & Engadin, Switzerland',
    highlights: ['Glacier Express scenic train', 'Lucerne Chapel Bridge', 'Matterhorn views'],
    mustEat: 'Swiss cheese fondue, Zermatt alpine steak',
    style: 'Scenic'
  },
  {
    slug: 'azores-adventure',
    title: 'Azores Adventure Week',
    desc: 'Volcanic lakes, whale watching, hot springs, and hiking trails across São Miguel island.',
    badge: '🌿 Nature',
    image: 'https://images.unsplash.com/photo-1582885938164-1af58ee6effa?q=80&w=600&auto=format&fit=crop',
    author: '🇵🇹', authorName: 'João M.', likes: '1.2K', saves: '478', price: '€6.99', oldPrice: '€13.99', discount: '50% OFF', days: '7 days',
    categories: ['🆕 New', '🌍 Europe'],
    budgetVal: 520,
    climate: 'temperate',
    type: 'adventure',
    spotsRemaining: 3,
    destination: 'São Miguel, Azores',
    highlights: ['Sete Cidades crater lakes', 'Terra Nostra hot spring', 'Whale watching boat tour'],
    mustEat: 'Cozido das Furnas, fresh Azorean steak',
    style: 'Adventure'
  },
  {
    slug: 'tokyo-food',
    title: 'Tokyo Food Tour',
    desc: 'From Tsukiji fish market to hidden ramen bars — a food lover\'s dream itinerary across Tokyo.',
    badge: '🍜 Food',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=600&auto=format&fit=crop',
    author: '🇯🇵', authorName: 'Yuki T.', likes: '2.9K', saves: '1.1K', price: '€4.99', oldPrice: '€9.99', discount: '50% OFF', days: '4 days',
    categories: ['🔥 Trending', '⭐ Top Rated', '🌏 Asia'],
    budgetVal: 800,
    climate: 'temperate',
    type: 'culture',
    spotsRemaining: 2,
    destination: 'Tokyo, Japan',
    highlights: ['Tsukiji market tasting', 'Shibuya Crossing views', 'Golden Gai bar hopping'],
    mustEat: 'Ichiran Ramen, Yurakucho Yakitori',
    style: 'Food & Culture'
  },
  {
    slug: 'bali-nomad',
    title: 'Bali Digital Nomad',
    desc: 'Work and surf in Canggu with the best cafes and co-working spaces.',
    badge: '💻 Remote',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=600&auto=format&fit=crop',
    author: '🇮🇩', authorName: 'Alex K.', likes: '5.2K', saves: '3K', price: 'Free', days: '30 days',
    categories: ['🆕 New', '💰 Budget', '🌏 Asia', '🔥 Trending'],
    budgetVal: 1200,
    climate: 'tropical',
    type: 'adventure',
    spotsRemaining: 5,
    destination: 'Canggu & Ubud, Bali',
    highlights: ['Canggu surfing lesson', 'Coworking at Dojo Bali', 'Monkey forest walk'],
    mustEat: 'Nasi Goreng, Crate Cafe avocado toast',
    style: 'Digital Nomad'
  },
  {
    slug: 'nyc-3-days',
    title: 'NYC in 3 Days',
    desc: 'Hit every iconic spot — Central Park, Brooklyn Bridge, Broadway, and the best pizza in Manhattan.',
    badge: '🗽 Classic',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=600&auto=format&fit=crop',
    author: '🇺🇸', authorName: 'Jake W.', likes: '4.5K', saves: '2.1K', price: 'Free', days: '3 days',
    categories: ['💰 Budget', '🗽 Americas', '⭐ Top Rated'],
    budgetVal: 450,
    climate: 'temperate',
    type: 'family',
    spotsRemaining: 4,
    destination: 'New York City, USA',
    highlights: ['Central Park walk', 'Broadway musical show', 'Brooklyn Bridge walk'],
    mustEat: 'Joe\'s Pizza slice, Katz\'s Pastrami sandwich',
    style: 'Classic'
  },
];

export default function Social() {
  const [activeTab, setActiveTab] = useState('🔥 Trending');
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [selectedClimate, setSelectedClimate] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Comparison states
  const [compareList, setCompareList] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState([]);

  // Favorites state
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('andor_favorites');
      if (stored) {
        try {
          setFavorites(safeParse(stored, []));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handleToggleFavorite = (slug) => {
    let nextFavorites;
    if (favorites.includes(slug)) {
      nextFavorites = favorites.filter(f => f !== slug);
    } else {
      nextFavorites = [...favorites, slug];
    }
    setFavorites(nextFavorites);
    localStorage.setItem('andor_favorites', JSON.stringify(nextFavorites));
  };

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 12 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 2, minutes: 45, seconds: 12 };
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (val) => String(val).padStart(2, '0');

  // Close compare modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsCompareModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const socialRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const el = socialRef.current;
      if (el) {
        const scrolled = window.scrollY;
        const offsetTop = el.offsetTop;
        const delta = scrolled - offsetTop;
        el.style.setProperty('--scroll-social', `${delta}px`);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setMaxBudget('');
    setSelectedClimate('');
    setSelectedStyle('');
  };

  const handleToggleCompare = (item) => {
    if (compareList.some(c => c.slug === item.slug)) {
      setCompareList(prev => prev.filter(c => c.slug !== item.slug));
    } else {
      if (compareList.length >= 2) {
        alert('You can compare up to 2 packages side-by-side.');
        return;
      }
      setCompareList(prev => [...prev, item]);
    }
  };

  // Combine Active Tab filter with Search Panel filters
  const filteredItineraries = itineraries.filter(item => {
    // 1. Tab category filter
    const matchesTab = item.categories.includes(activeTab);
    if (!matchesTab) return false;

    // 2. Search query filter (destination, title, description)
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchDesc = item.desc.toLowerCase().includes(query);
      const matchDest = item.destination.toLowerCase().includes(query);
      if (!matchTitle && !matchDesc && !matchDest) return false;
    }

    // 3. Budget limit filter
    if (maxBudget) {
      const limit = parseFloat(maxBudget);
      if (!isNaN(limit) && item.budgetVal > limit) return false;
    }

    // 4. Climate filter
    if (selectedClimate && item.climate !== selectedClimate) return false;

    // 5. Style/Type filter
    if (selectedStyle && item.type !== selectedStyle) return false;

    return true;
  });

  return (
    <section ref={socialRef} className={styles.social} id="community">
      {/* Decorative Parallax Blobs */}
      <div className={styles.decorBlob1} style={{ transform: 'translateY(calc(var(--scroll-social, 0px) * -0.12))' }} />
      <div className={styles.decorBlob2} style={{ transform: 'translateY(calc(var(--scroll-social, 0px) * 0.08))' }} />

      <div className={styles.header}>
        <span className="section-label">🌐 Community</span>
        <h2 className="section-title">Discover and share amazing trips</h2>
        <p className="section-subtitle mx-auto">
          Browse trending itineraries from travelers worldwide, or create and sell your own travel guides.
        </p>
        <div className={styles.countdownBanner}>
          <span className={styles.countdownFlash}>⚡ OFERTA DE LANÇAMENTO</span>
          <span>Obtém 50% de desconto em guias pagos! Termina em: <strong>{formatTime(timeLeft.hours)}h {formatTime(timeLeft.minutes)}m {formatTime(timeLeft.seconds)}s</strong></span>
        </div>
        <p style={{ marginTop: '14px', fontSize: '14px', color: 'var(--ocean)', fontWeight: '600' }}>
          Looking for a bespoke luxury experience?{' '}
          <span 
            style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--sunset-coral)' }} 
            onClick={() => window.dispatchEvent(new Event('open-custom-request'))}
          >
            Request a Custom Tailor-made Trip ✨
          </span>
        </p>
      </div>

      <div className={styles.content}>
        {/* Search and Filters Drawer Panel */}
        <div className={styles.filtersWrapper}>
          <div className={styles.filtersTitle}>
            <span>🔍 Refine Destinies</span>
          </div>
          <div className={styles.filterControls}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Search destinations</label>
              <input 
                type="text" 
                placeholder="e.g. Lisbon, Paris, Tokyo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Max Budget (€)</label>
              <input 
                type="number" 
                placeholder="e.g. 500"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Climate</label>
              <select 
                value={selectedClimate} 
                onChange={(e) => setSelectedClimate(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Any Climate</option>
                <option value="tropical">Tropical 🌴</option>
                <option value="temperate">Temperate 🌤️</option>
                <option value="cold">Cold ❄️</option>
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Style</label>
              <select 
                value={selectedStyle} 
                onChange={(e) => setSelectedStyle(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Any Style</option>
                <option value="adventure">Adventure 🥾</option>
                <option value="romance">Romance 💕</option>
                <option value="family">Family 👨‍👩‍👧‍👦</option>
                <option value="culture">Culture 🏛️</option>
              </select>
            </div>
            
            <button 
              type="button" 
              className={styles.filterReset} 
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Grid key combines activeTab + filters so the animation triggers on query shifts */}
        <div 
          className={`${styles.grid} animate-fade-in-up`} 
          key={`${activeTab}-${debouncedSearch}-${maxBudget}-${selectedClimate}-${selectedStyle}`}
        >
          {filteredItineraries.length > 0 ? (
            filteredItineraries.map((item, i) => {
              const isCompared = compareList.some(c => c.slug === item.slug);
              return (
                <div key={i} className={styles.card}>
                  <Link href={`/itinerary/${item.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div className={styles.cardImage}>
                      <div 
                        className={styles.cardBg} 
                        style={{ backgroundImage: `url(${item.image})` }}
                      ></div>
                      <div className={styles.cardOverlay}></div>
                      <span className={styles.cardBadge}>{item.badge}</span>
                      
                      {item.price !== 'Free' && (
                        <div className={styles.cardPriceContainer}>
                          <span className={styles.cardPrice}>{item.price}</span>
                          {item.oldPrice && <span className={styles.cardPriceOld}>{item.oldPrice}</span>}
                          {item.discount && <span className={styles.cardDiscountBadge}>{item.discount}</span>}
                        </div>
                      )}
                      {item.price === 'Free' && <span className={`${styles.cardPrice} ${styles.cardPriceFree}`}>Free</span>}
                      
                      {/* Heart Favorite toggle button */}
                      <button
                        type="button"
                        className={`${styles.favoriteButton} ${favorites.includes(item.slug) ? styles.favoriteActive : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleFavorite(item.slug);
                        }}
                      >
                        <svg className={styles.heartSvg} viewBox="0 0 24 24" width="18" height="18">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </button>

                      {/* Urgency Counter Badge */}
                      {item.spotsRemaining && (
                        <div className={styles.cardUrgency}>
                          🚨 Only {item.spotsRemaining} spots left!
                        </div>
                      )}
                      
                      {/* Compare toggle button */}
                      <div className={styles.compareButtonWrapper} onClick={(e) => e.stopPropagation()}>
                        <button 
                          type="button"
                          className={`${styles.compareButton} ${isCompared ? styles.compareButtonActive : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleCompare(item);
                          }}
                        >
                          {isCompared ? '✓ Compare' : '+ Compare'}
                        </button>
                      </div>
                    </div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{item.title}</h3>
                      <p className={styles.cardDesc}>{item.desc}</p>
                      <div className={styles.cardMeta}>
                        <div className={styles.cardAuthor}>
                          <div className={styles.cardAuthorAvatar} style={{ background: '#F0F0F0' }}>{item.author}</div>
                          <span className={styles.cardAuthorName}>{item.authorName} • {item.days}</span>
                        </div>
                        <div className={styles.cardStats}>
                          <span className={styles.cardStat}>❤️ {item.likes}</span>
                          <span className={styles.cardStat}>📌 {item.saves}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <p>No itineraries found matching the filter criteria.</p>
            </div>
          )}
        </div>

        <div className={`${styles.creatorBanner} animate-fade-in-up animate-delay-2`}>
          <div className={styles.creatorBannerBg}></div>
          <div className={styles.creatorBannerContent}>
            <div className={styles.creatorText}>
              <h3 className={styles.creatorTitle}>Become a travel creator ✨</h3>
              <p className={styles.creatorDesc}>
                Share your unique travel expertise. Create premium itineraries and earn €2–€10 per sale. Join 1,000+ creators already on Andor.
              </p>
            </div>
            <button className="btn btn-gold btn-lg" onClick={() => window.dispatchEvent(new Event('open-auth-modal'))}>Start Creating</button>
          </div>
        </div>
      </div>

      {/* Floating Compare Bar */}
      {compareList.length > 0 && (
        <div className={styles.compareFloatingBar}>
          <div className={styles.compareFloatingContent}>
            <div className={styles.compareFloatingInfo}>
              <div className={styles.compareThumbnails}>
                {compareList.map((item, idx) => (
                  <img 
                    key={idx} 
                    src={item.image} 
                    alt={item.title} 
                    className={styles.compareThumb} 
                  />
                ))}
              </div>
              <div className={styles.compareFloatingTitle}>
                Compare Packages <span>({compareList.length}/2 selected)</span>
              </div>
            </div>
            <div className={styles.compareFloatingActions}>
              <button 
                type="button"
                className={styles.compareFloatingCancel} 
                onClick={() => setCompareList([])}
              >
                Clear
              </button>
              <button 
                type="button"
                className={styles.compareFloatingBtn} 
                disabled={compareList.length < 2}
                onClick={() => setIsCompareModalOpen(true)}
              >
                Compare Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {isCompareModalOpen && compareList.length === 2 && (
        <div className={styles.compareModalOverlay} onClick={() => setIsCompareModalOpen(false)}>
          <div className={styles.compareModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.compareModalHeader}>
              <h3 className={styles.compareModalTitle}>Compare Itineraries</h3>
              <button className={styles.compareModalClose} onClick={() => setIsCompareModalOpen(false)}>✕</button>
            </div>
            <div className={styles.compareModalBody}>
              <table className={styles.compareTable}>
                <thead>
                  <tr>
                    <th className={styles.compareFeatureLabel}>Package</th>
                    <th>
                      <div className={styles.compareHeaderCard}>
                        <img src={compareList[0].image} alt={compareList[0].title} className={styles.compareHeaderImg} />
                        <h4 className={styles.compareHeaderTitle}>{compareList[0].title}</h4>
                        <span className={styles.compareHeaderBadge}>{compareList[0].badge}</span>
                      </div>
                    </th>
                    <th>
                      <div className={styles.compareHeaderCard}>
                        <img src={compareList[1].image} alt={compareList[1].title} className={styles.compareHeaderImg} />
                        <h4 className={styles.compareHeaderTitle}>{compareList[1].title}</h4>
                        <span className={styles.compareHeaderBadge}>{compareList[1].badge}</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.compareFeatureLabel}>Destination</td>
                    <td style={{ fontWeight: '600', color: 'var(--navy)' }}>{compareList[0].destination}</td>
                    <td style={{ fontWeight: '600', color: 'var(--navy)' }}>{compareList[1].destination}</td>
                  </tr>
                  <tr>
                    <td className={styles.compareFeatureLabel}>Duration</td>
                    <td>{compareList[0].days}</td>
                    <td>{compareList[1].days}</td>
                  </tr>
                  <tr>
                    <td className={styles.compareFeatureLabel}>Travel Style</td>
                    <td>{compareList[0].style}</td>
                    <td>{compareList[1].style}</td>
                  </tr>
                  <tr>
                    <td className={styles.compareFeatureLabel}>Estimated Cost</td>
                    <td style={{ color: 'var(--ocean)', fontWeight: '700' }}>
                      {compareList[0].price === 'Free' ? 'Free' : `From ${compareList[0].price} (€${compareList[0].budgetVal} total)`}
                    </td>
                    <td style={{ color: 'var(--ocean)', fontWeight: '700' }}>
                      {compareList[1].price === 'Free' ? 'Free' : `From ${compareList[1].price} (€${compareList[1].budgetVal} total)`}
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.compareFeatureLabel}>Likes & Saves</td>
                    <td>❤️ {compareList[0].likes} • 📌 {compareList[0].saves}</td>
                    <td>❤️ {compareList[1].likes} • 📌 {compareList[1].saves}</td>
                  </tr>
                  <tr>
                    <td className={styles.compareFeatureLabel}>Spots Left</td>
                    <td style={{ color: 'var(--sunset-coral)', fontWeight: '600' }}>🚨 Only {compareList[0].spotsRemaining} spots left</td>
                    <td style={{ color: 'var(--sunset-coral)', fontWeight: '600' }}>🚨 Only {compareList[1].spotsRemaining} spots left</td>
                  </tr>
                  <tr>
                    <td className={styles.compareFeatureLabel}>Key Highlights</td>
                    <td>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', lineHeight: '1.6' }}>
                        {compareList[0].highlights?.map((h, idx) => (
                          <li key={idx}>{h}</li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', lineHeight: '1.6' }}>
                        {compareList[1].highlights?.map((h, idx) => (
                          <li key={idx}>{h}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.compareFeatureLabel}>Must Eat</td>
                    <td>🍴 {compareList[0].mustEat}</td>
                    <td>🍴 {compareList[1].mustEat}</td>
                  </tr>
                  <tr>
                    <td className={styles.compareFeatureLabel}>Action</td>
                    <td>
                      <Link 
                        href={`/itinerary/${compareList[0].slug}`} 
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}
                        onClick={() => setIsCompareModalOpen(false)}
                      >
                        View Details
                      </Link>
                    </td>
                    <td>
                      <Link 
                        href={`/itinerary/${compareList[1].slug}`} 
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}
                        onClick={() => setIsCompareModalOpen(false)}
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
