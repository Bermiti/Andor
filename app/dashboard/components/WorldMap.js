'use client';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './WorldMap.module.css';

const countries = [
  { code: 'PT', name: 'Portugal', x: 44, y: 39 },
  { code: 'ES', name: 'Spain', x: 46, y: 38 },
  { code: 'FR', name: 'France', x: 48, y: 34 },
  { code: 'IT', name: 'Italy', x: 51, y: 36 },
  { code: 'DE', name: 'Germany', x: 50, y: 31 },
  { code: 'GB', name: 'United Kingdom', x: 46, y: 29 },
  { code: 'IE', name: 'Ireland', x: 44, y: 28 },
  { code: 'NL', name: 'Netherlands', x: 49, y: 30 },
  { code: 'BE', name: 'Belgium', x: 48.5, y: 31 },
  { code: 'CH', name: 'Switzerland', x: 50, y: 34 },
  { code: 'AT', name: 'Austria', x: 52, y: 33 },
  { code: 'GR', name: 'Greece', x: 55, y: 38 },
  { code: 'TR', name: 'Turkey', x: 59, y: 37 },
  { code: 'SE', name: 'Sweden', x: 52, y: 24 },
  { code: 'NO', name: 'Norway', x: 50, y: 23 },
  { code: 'DK', name: 'Denmark', x: 50, y: 28 },
  { code: 'FI', name: 'Finland', x: 55, y: 22 },
  { code: 'PL', name: 'Poland', x: 53, y: 30 },
  { code: 'CZ', name: 'Czechia', x: 52, y: 31 },
  { code: 'HR', name: 'Croatia', x: 53, y: 35 },
  { code: 'HU', name: 'Hungary', x: 54, y: 33 },
  { code: 'RO', name: 'Romania', x: 56, y: 34 },
  { code: 'BG', name: 'Bulgaria', x: 56, y: 36 },
  { code: 'IS', name: 'Iceland', x: 40, y: 20 },
  { code: 'RU', name: 'Russia', x: 65, y: 25 },
  { code: 'UA', name: 'Ukraine', x: 58, y: 31 },
  { code: 'MA', name: 'Morocco', x: 45, y: 43 },
  { code: 'EG', name: 'Egypt', x: 57, y: 44 },
  { code: 'ZA', name: 'South Africa', x: 55, y: 72 },
  { code: 'KE', name: 'Kenya', x: 60, y: 58 },
  { code: 'TZ', name: 'Tanzania', x: 59, y: 62 },
  { code: 'NG', name: 'Nigeria', x: 49, y: 54 },
  { code: 'GH', name: 'Ghana', x: 46, y: 55 },
  { code: 'SN', name: 'Senegal', x: 41, y: 50 },
  { code: 'TN', name: 'Tunisia', x: 50, y: 40 },
  { code: 'US', name: 'United States', x: 22, y: 36 },
  { code: 'CA', name: 'Canada', x: 22, y: 26 },
  { code: 'MX', name: 'Mexico', x: 18, y: 46 },
  { code: 'BR', name: 'Brazil', x: 32, y: 60 },
  { code: 'AR', name: 'Argentina', x: 30, y: 72 },
  { code: 'CO', name: 'Colombia', x: 24, y: 54 },
  { code: 'PE', name: 'Peru', x: 24, y: 60 },
  { code: 'CL', name: 'Chile', x: 27, y: 70 },
  { code: 'CR', name: 'Costa Rica', x: 20, y: 50 },
  { code: 'CU', name: 'Cuba', x: 23, y: 46 },
  { code: 'JP', name: 'Japan', x: 85, y: 36 },
  { code: 'CN', name: 'China', x: 78, y: 38 },
  { code: 'KR', name: 'South Korea', x: 83, y: 36 },
  { code: 'TH', name: 'Thailand', x: 77, y: 50 },
  { code: 'VN', name: 'Vietnam', x: 79, y: 49 },
  { code: 'ID', name: 'Indonesia', x: 80, y: 58 },
  { code: 'IN', name: 'India', x: 72, y: 46 },
  { code: 'NP', name: 'Nepal', x: 74, y: 42 },
  { code: 'LK', name: 'Sri Lanka', x: 73, y: 52 },
  { code: 'PH', name: 'Philippines', x: 83, y: 50 },
  { code: 'MY', name: 'Malaysia', x: 78, y: 55 },
  { code: 'SG', name: 'Singapore', x: 79, y: 56 },
  { code: 'AE', name: 'United Arab Emirates', x: 66, y: 44 },
  { code: 'AU', name: 'Australia', x: 84, y: 70 },
  { code: 'NZ', name: 'New Zealand', x: 90, y: 76 },
  { code: 'FJ', name: 'Fiji', x: 93, y: 64 },
  { code: 'IL', name: 'Israel', x: 58, y: 42 },
  { code: 'JO', name: 'Jordan', x: 59, y: 42 },
];

export default function WorldMap() {
  const { user, toggleCountry } = useAuth();
  const visited = user?.visitedCountries || [];
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const percentage = Math.round((visited.length / countries.length) * 100);

  return (
    <div className={styles.container}>
      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{visited.length}</div>
          <div className={styles.statLabel}>Countries Visited</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{countries.length - visited.length}</div>
          <div className={styles.statLabel}>To Visit</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{percentage}%</div>
          <div className={styles.statLabel}>of the World</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${percentage}%` }}></div>
        </div>
        <span className={styles.progressLabel}>{percentage}% of the world explored</span>
      </div>

      {/* Map */}
      <div className={styles.mapArea}>
        <div className={styles.map}>
          {countries.map(country => {
            const isVisited = visited.includes(country.code);
            return (
              <button
                key={country.code}
                className={`${styles.pin} ${isVisited ? styles.pinVisited : ''}`}
                style={{ left: `${country.x}%`, top: `${country.y}%` }}
                onClick={() => toggleCountry(country.code)}
                onMouseEnter={() => setHoveredCountry(country)}
                onMouseLeave={() => setHoveredCountry(null)}
                title={country.name}
              >
                <span className={styles.pinDot}></span>
                {hoveredCountry?.code === country.code && (
                  <div className={styles.tooltip}>
                    {country.name}
                    <span className={styles.tooltipSub}>
                      {isVisited ? '✓ Visited — click to remove' : 'Click to mark'}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Country List */}
      <div className={styles.countrySection}>
        <div className={styles.countrySectionHeader}>
          <h3 className={styles.countrySectionTitle}>All Countries</h3>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.countryGrid}>
          {filteredCountries.map(country => {
            const isVisited = visited.includes(country.code);
            return (
              <button
                key={country.code}
                className={`${styles.countryChip} ${isVisited ? styles.countryChipVisited : ''}`}
                onClick={() => toggleCountry(country.code)}
              >
                <span className={styles.countryCheck}>{isVisited ? '✓' : '+'}</span>
                {country.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
