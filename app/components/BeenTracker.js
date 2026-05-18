'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './BeenTracker.module.css';

// Using a lighter weight Globe component if possible, or optimizing the existing one
import Globe from 'react-globe.gl';

const COUNTRIES = [
  { code: '620', name: 'Portugal', emoji: '🇵🇹' },
  { code: '392', name: 'Japan', emoji: '🇯🇵' },
  { code: '250', name: 'France', emoji: '🇫🇷' },
  { code: '380', name: 'Italy', emoji: '🇮🇹' },
  { code: '724', name: 'Spain', emoji: '🇪🇸' },
  { code: '076', name: 'Brazil', emoji: '🇧🇷' },
  { code: '840', name: 'USA', emoji: '🇺🇸' },
  { code: '826', name: 'UK', emoji: '🇬🇧' },
];

export default function BeenTracker() {
  const { user, toggleCountry } = useAuth();
  const globeRef = useRef();
  const visited = user?.visitedCountries || [];
  const [searchQuery, setSearchQuery] = useState('');

  const percentage = Math.round((visited.length / 195) * 100);

  // Aggressively optimized GeoJSON (low res)
  const [countriesData, setCountriesData] = useState({ features: [] });
  useEffect(() => {
    // Using a low-resolution world map to prevent lag
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountriesData);
  }, []);

  const polygonData = useMemo(() => {
    return countriesData.features.map(feat => ({
      ...feat,
      id: feat.properties.ISO_N3,
      color: visited.includes(feat.properties.ISO_N3) 
        ? '#38BDF8' 
        : 'rgba(255, 255, 255, 0.1)'
    }));
  }, [countriesData, visited]);

  return (
    <div className={styles.container}>
      <div className={styles.visualSide}>
        <div className={styles.globeWrapper}>
          <Globe
            ref={globeRef}
            width={400}
            height={400}
            backgroundColor="rgba(0,0,0,0)"
            showAtmosphere={false}
            showGraticules={false}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
            polygonsData={polygonData}
            polygonCapColor={d => d.color}
            polygonSideColor={() => 'rgba(0, 100, 0, 0.15)'}
            polygonStrokeColor={() => '#111'}
            polygonAltitude={0.01}
            onPolygonClick={({ properties: p }) => toggleCountry(p.ISO_N3)}
          />
          <div className={styles.statsOverlay}>
            <span className={styles.bigNumber}>{visited.length}</span>
            <span className={styles.label}>Nations</span>
          </div>
        </div>

        <div className={styles.statsCard}>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>World Coverage</div>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar} style={{ width: `${percentage}%` }}></div>
            </div>
            <div className={styles.statValue}>{percentage}% Explorer Level</div>
          </div>
        </div>
      </div>

      <div className={styles.listSide}>
        <div className={styles.header}>
          <h2 className={styles.title}>Track Your <span className="gradient-text">Odyssey</span></h2>
          <div className={styles.searchBar}>
            <input 
              type="text" 
              placeholder="Search countries..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.countryGrid}>
          {COUNTRIES.map(country => (
            <button
              key={country.code}
              className={`${styles.countryCard} ${visited.includes(country.code) ? styles.visited : ''}`}
              onClick={() => toggleCountry(country.code)}
            >
              <span className={styles.flag}>{country.emoji}</span>
              <span className={styles.countryName}>{country.name}</span>
              {visited.includes(country.code) && <span className={styles.check}>✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
