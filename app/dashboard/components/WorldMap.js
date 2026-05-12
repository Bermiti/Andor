'use client';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './WorldMap.module.css';

const countries = [
  { code: 'PT', name: 'Portugal', x: 44, y: 39 },
  { code: 'ES', name: 'Espanha', x: 46, y: 38 },
  { code: 'FR', name: 'França', x: 48, y: 34 },
  { code: 'IT', name: 'Itália', x: 51, y: 36 },
  { code: 'DE', name: 'Alemanha', x: 50, y: 31 },
  { code: 'GB', name: 'Reino Unido', x: 46, y: 29 },
  { code: 'IE', name: 'Irlanda', x: 44, y: 28 },
  { code: 'NL', name: 'Holanda', x: 49, y: 30 },
  { code: 'BE', name: 'Bélgica', x: 48.5, y: 31 },
  { code: 'CH', name: 'Suíça', x: 50, y: 34 },
  { code: 'AT', name: 'Áustria', x: 52, y: 33 },
  { code: 'GR', name: 'Grécia', x: 55, y: 38 },
  { code: 'TR', name: 'Turquia', x: 59, y: 37 },
  { code: 'SE', name: 'Suécia', x: 52, y: 24 },
  { code: 'NO', name: 'Noruega', x: 50, y: 23 },
  { code: 'DK', name: 'Dinamarca', x: 50, y: 28 },
  { code: 'FI', name: 'Finlândia', x: 55, y: 22 },
  { code: 'PL', name: 'Polónia', x: 53, y: 30 },
  { code: 'CZ', name: 'Chéquia', x: 52, y: 31 },
  { code: 'HR', name: 'Croácia', x: 53, y: 35 },
  { code: 'HU', name: 'Hungria', x: 54, y: 33 },
  { code: 'RO', name: 'Roménia', x: 56, y: 34 },
  { code: 'BG', name: 'Bulgária', x: 56, y: 36 },
  { code: 'IS', name: 'Islândia', x: 40, y: 20 },
  { code: 'RU', name: 'Rússia', x: 65, y: 25 },
  { code: 'UA', name: 'Ucrânia', x: 58, y: 31 },
  { code: 'MA', name: 'Marrocos', x: 45, y: 43 },
  { code: 'EG', name: 'Egito', x: 57, y: 44 },
  { code: 'ZA', name: 'África do Sul', x: 55, y: 72 },
  { code: 'KE', name: 'Quénia', x: 60, y: 58 },
  { code: 'TZ', name: 'Tanzânia', x: 59, y: 62 },
  { code: 'NG', name: 'Nigéria', x: 49, y: 54 },
  { code: 'GH', name: 'Gana', x: 46, y: 55 },
  { code: 'SN', name: 'Senegal', x: 41, y: 50 },
  { code: 'TN', name: 'Tunísia', x: 50, y: 40 },
  { code: 'US', name: 'Estados Unidos', x: 22, y: 36 },
  { code: 'CA', name: 'Canadá', x: 22, y: 26 },
  { code: 'MX', name: 'México', x: 18, y: 46 },
  { code: 'BR', name: 'Brasil', x: 32, y: 60 },
  { code: 'AR', name: 'Argentina', x: 30, y: 72 },
  { code: 'CO', name: 'Colômbia', x: 24, y: 54 },
  { code: 'PE', name: 'Peru', x: 24, y: 60 },
  { code: 'CL', name: 'Chile', x: 27, y: 70 },
  { code: 'CR', name: 'Costa Rica', x: 20, y: 50 },
  { code: 'CU', name: 'Cuba', x: 23, y: 46 },
  { code: 'JP', name: 'Japão', x: 85, y: 36 },
  { code: 'CN', name: 'China', x: 78, y: 38 },
  { code: 'KR', name: 'Coreia do Sul', x: 83, y: 36 },
  { code: 'TH', name: 'Tailândia', x: 77, y: 50 },
  { code: 'VN', name: 'Vietname', x: 79, y: 49 },
  { code: 'ID', name: 'Indonésia', x: 80, y: 58 },
  { code: 'IN', name: 'Índia', x: 72, y: 46 },
  { code: 'NP', name: 'Nepal', x: 74, y: 42 },
  { code: 'LK', name: 'Sri Lanka', x: 73, y: 52 },
  { code: 'PH', name: 'Filipinas', x: 83, y: 50 },
  { code: 'MY', name: 'Malásia', x: 78, y: 55 },
  { code: 'SG', name: 'Singapura', x: 79, y: 56 },
  { code: 'AE', name: 'Emirados Árabes', x: 66, y: 44 },
  { code: 'AU', name: 'Austrália', x: 84, y: 70 },
  { code: 'NZ', name: 'Nova Zelândia', x: 90, y: 76 },
  { code: 'FJ', name: 'Fiji', x: 93, y: 64 },
  { code: 'IL', name: 'Israel', x: 58, y: 42 },
  { code: 'JO', name: 'Jordânia', x: 59, y: 42 },
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
          <div className={styles.statLabel}>Países Visitados</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{countries.length - visited.length}</div>
          <div className={styles.statLabel}>Por Visitar</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{percentage}%</div>
          <div className={styles.statLabel}>do Mundo</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${percentage}%` }}></div>
        </div>
        <span className={styles.progressLabel}>{percentage}% do mundo explorado</span>
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
                      {isVisited ? '✓ Visitado — clica para remover' : 'Clica para marcar'}
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
          <h3 className={styles.countrySectionTitle}>Todos os Países</h3>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Pesquisar país..."
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
