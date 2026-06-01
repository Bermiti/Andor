'use client';
import { useState, useMemo } from 'react';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from './ToastProvider';
import { Globe } from 'lucide-react';
import styles from './CountryManager.module.css';

// Map of country names to ISO 3166-1 numeric codes (used by world-atlas)
const COUNTRY_DATA = [
  { name: 'Afghanistan', code: '004' }, { name: 'Albania', code: '008' }, { name: 'Algeria', code: '012' },
  { name: 'Angola', code: '024' }, { name: 'Argentina', code: '032' }, { name: 'Armenia', code: '051' },
  { name: 'Australia', code: '036' }, { name: 'Austria', code: '040' }, { name: 'Azerbaijan', code: '031' },
  { name: 'Bahamas', code: '044' }, { name: 'Bangladesh', code: '050' }, { name: 'Belarus', code: '112' },
  { name: 'Belgium', code: '056' }, { name: 'Belize', code: '084' }, { name: 'Benin', code: '204' },
  { name: 'Bhutan', code: '064' }, { name: 'Bolivia', code: '068' }, { name: 'Bosnia and Herzegovina', code: '070' },
  { name: 'Botswana', code: '072' }, { name: 'Brazil', code: '076' }, { name: 'Brunei', code: '096' },
  { name: 'Bulgaria', code: '100' }, { name: 'Burkina Faso', code: '854' }, { name: 'Burundi', code: '108' },
  { name: 'Cambodia', code: '116' }, { name: 'Cameroon', code: '120' }, { name: 'Canada', code: '124' },
  { name: 'Central African Republic', code: '140' }, { name: 'Chad', code: '148' }, { name: 'Chile', code: '152' },
  { name: 'China', code: '156' }, { name: 'Colombia', code: '170' }, { name: 'Congo', code: '178' },
  { name: 'Democratic Republic of the Congo', code: '180' }, { name: 'Costa Rica', code: '188' },
  { name: 'Croatia', code: '191' }, { name: 'Cuba', code: '192' }, { name: 'Cyprus', code: '196' },
  { name: 'Czech Republic', code: '203' }, { name: 'Denmark', code: '208' }, { name: 'Djibouti', code: '262' },
  { name: 'Dominican Republic', code: '214' }, { name: 'Ecuador', code: '218' }, { name: 'Egypt', code: '818' },
  { name: 'El Salvador', code: '222' }, { name: 'Equatorial Guinea', code: '226' }, { name: 'Eritrea', code: '232' },
  { name: 'Estonia', code: '233' }, { name: 'Eswatini', code: '748' }, { name: 'Ethiopia', code: '231' },
  { name: 'Fiji', code: '242' }, { name: 'Finland', code: '246' }, { name: 'France', code: '250' },
  { name: 'Gabon', code: '266' }, { name: 'Gambia', code: '270' }, { name: 'Georgia', code: '268' },
  { name: 'Germany', code: '276' }, { name: 'Ghana', code: '288' }, { name: 'Greece', code: '300' },
  { name: 'Greenland', code: '304' }, { name: 'Guatemala', code: '320' }, { name: 'Guinea', code: '324' },
  { name: 'Guinea-Bissau', code: '624' }, { name: 'Guyana', code: '328' }, { name: 'Haiti', code: '332' },
  { name: 'Honduras', code: '340' }, { name: 'Hungary', code: '348' }, { name: 'Iceland', code: '352' },
  { name: 'India', code: '356' }, { name: 'Indonesia', code: '360' }, { name: 'Iran', code: '364' },
  { name: 'Iraq', code: '368' }, { name: 'Ireland', code: '372' }, { name: 'Israel', code: '376' },
  { name: 'Italy', code: '380' }, { name: 'Ivory Coast', code: '384' }, { name: 'Jamaica', code: '388' },
  { name: 'Japan', code: '392' }, { name: 'Jordan', code: '400' }, { name: 'Kazakhstan', code: '398' },
  { name: 'Kenya', code: '404' }, { name: 'Kosovo', code: '-99' }, { name: 'Kuwait', code: '414' },
  { name: 'Kyrgyzstan', code: '417' }, { name: 'Laos', code: '418' }, { name: 'Latvia', code: '428' },
  { name: 'Lebanon', code: '422' }, { name: 'Lesotho', code: '426' }, { name: 'Liberia', code: '430' },
  { name: 'Libya', code: '434' }, { name: 'Lithuania', code: '440' }, { name: 'Luxembourg', code: '442' },
  { name: 'Madagascar', code: '450' }, { name: 'Malawi', code: '454' }, { name: 'Malaysia', code: '458' },
  { name: 'Mali', code: '466' }, { name: 'Mauritania', code: '478' }, { name: 'Mexico', code: '484' },
  { name: 'Moldova', code: '498' }, { name: 'Mongolia', code: '496' }, { name: 'Montenegro', code: '499' },
  { name: 'Morocco', code: '504' }, { name: 'Mozambique', code: '508' }, { name: 'Myanmar', code: '104' },
  { name: 'Namibia', code: '516' }, { name: 'Nepal', code: '524' }, { name: 'Netherlands', code: '528' },
  { name: 'New Zealand', code: '554' }, { name: 'Nicaragua', code: '558' }, { name: 'Niger', code: '562' },
  { name: 'Nigeria', code: '566' }, { name: 'North Korea', code: '408' }, { name: 'North Macedonia', code: '807' },
  { name: 'Norway', code: '578' }, { name: 'Oman', code: '512' }, { name: 'Pakistan', code: '586' },
  { name: 'Palestine', code: '275' }, { name: 'Panama', code: '591' }, { name: 'Papua New Guinea', code: '598' },
  { name: 'Paraguay', code: '600' }, { name: 'Peru', code: '604' }, { name: 'Philippines', code: '608' },
  { name: 'Poland', code: '616' }, { name: 'Portugal', code: '620' }, { name: 'Puerto Rico', code: '630' },
  { name: 'Qatar', code: '634' }, { name: 'Romania', code: '642' }, { name: 'Russia', code: '643' },
  { name: 'Rwanda', code: '646' }, { name: 'Saudi Arabia', code: '682' }, { name: 'Senegal', code: '686' },
  { name: 'Serbia', code: '688' }, { name: 'Sierra Leone', code: '694' }, { name: 'Singapore', code: '702' },
  { name: 'Slovakia', code: '703' }, { name: 'Slovenia', code: '705' }, { name: 'Solomon Islands', code: '090' },
  { name: 'Somalia', code: '706' }, { name: 'South Africa', code: '710' }, { name: 'South Korea', code: '410' },
  { name: 'South Sudan', code: '728' }, { name: 'Spain', code: '724' }, { name: 'Sri Lanka', code: '144' },
  { name: 'Sudan', code: '729' }, { name: 'Suriname', code: '740' }, { name: 'Sweden', code: '752' },
  { name: 'Switzerland', code: '756' }, { name: 'Syria', code: '760' }, { name: 'Taiwan', code: '158' },
  { name: 'Tajikistan', code: '762' }, { name: 'Tanzania', code: '834' }, { name: 'Thailand', code: '764' },
  { name: 'Timor-Leste', code: '626' }, { name: 'Togo', code: '768' }, { name: 'Trinidad and Tobago', code: '780' },
  { name: 'Tunisia', code: '788' }, { name: 'Turkey', code: '792' }, { name: 'Turkmenistan', code: '795' },
  { name: 'Uganda', code: '800' }, { name: 'Ukraine', code: '804' }, { name: 'United Arab Emirates', code: '784' },
  { name: 'United Kingdom', code: '826' }, { name: 'United States', code: '840' }, { name: 'Uruguay', code: '858' },
  { name: 'Uzbekistan', code: '860' }, { name: 'Vanuatu', code: '548' }, { name: 'Venezuela', code: '862' },
  { name: 'Vietnam', code: '704' }, { name: 'Western Sahara', code: '732' }, { name: 'Yemen', code: '887' },
  { name: 'Zambia', code: '894' }, { name: 'Zimbabwe', code: '716' },
];

export default function CountryManager({ visitedCountries = [], onToggleCountry }) {
  const [search, setSearch] = useState('');
  const [justAdded, setJustAdded] = useState(null);
  const [pendingRemoveCountry, setPendingRemoveCountry] = useState(null);
  const { success } = useToast();

  const visitedNames = useMemo(() => {
    return COUNTRY_DATA.filter(c => visitedCountries.includes(c.code)).sort((a, b) => a.name.localeCompare(b.name));
  }, [visitedCountries]);

  const suggestions = useMemo(() => {
    if (search.length < 1) return [];
    const lower = search.toLowerCase();
    return COUNTRY_DATA
      .filter(c => c.name.toLowerCase().includes(lower) && !visitedCountries.includes(c.code))
      .slice(0, 6);
  }, [search, visitedCountries]);

  const addCountry = (country) => {
    onToggleCountry(country.code);
    setSearch('');
    setJustAdded(country.code);
    setTimeout(() => setJustAdded(null), 1500);
  };

  const requestRemoveCountry = (country) => {
    setPendingRemoveCountry(country);
  };

  const confirmRemoveCountry = () => {
    if (!pendingRemoveCountry) return;
    onToggleCountry(pendingRemoveCountry.code);
    success(`${pendingRemoveCountry.name} removido dos países visitados.`);
    setPendingRemoveCountry(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      addCountry(suggestions[0]);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.statsRow}>
          <div className={styles.statBox}>
            <span className={styles.statNumber}>{visitedNames.length}</span>
            <span className={styles.statLabel}>Visitados</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statBox}>
            <span className={styles.statNumber}>{COUNTRY_DATA.length - visitedNames.length}</span>
            <span className={styles.statLabel}>Por visitar</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statBox}>
            <span className={styles.statNumber}>{Math.round((visitedNames.length / COUNTRY_DATA.length) * 100)}%</span>
            <span className={styles.statLabel}>do mundo</span>
          </div>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${(visitedNames.length / COUNTRY_DATA.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className={styles.searchSection}>
        <label className={styles.searchLabel}>Adicionar país</label>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Pesquisar países..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        {suggestions.length > 0 && (
          <div className={styles.suggestions}>
            {suggestions.map(country => (
              <button
                key={country.code}
                className={styles.suggestionItem}
                onClick={() => addCountry(country)}
              >
                <span>{country.name}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.addIcon}>
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.listSection}>
        <h4 className={styles.listTitle}>
          Países visitados
          <span className={styles.listCount}>{visitedNames.length}</span>
        </h4>
        {visitedNames.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <Globe size={48} strokeWidth={1.5} color="var(--gold)" />
            </span>
            <p>O teu mapa de viagens está vazio.</p>
            <p className={styles.emptyHint}>Pesquisa um país acima para começar.</p>
          </div>
        ) : (
          <div className={styles.countryList}>
            {visitedNames.map(country => (
              <div
                key={country.code}
                className={`${styles.countryItem} ${justAdded === country.code ? styles.justAdded : ''}`}
              >
                <span className={styles.countryDot}></span>
                <span className={styles.countryName}>{country.name}</span>
                <button
                  className={styles.removeBtn}
                  onClick={() => requestRemoveCountry(country)}
                  aria-label={`Remover ${country.name}`}
                  title={`Remover ${country.name}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={Boolean(pendingRemoveCountry)}
        title="Remover país visitado?"
        description="Este país sai do teu mapa de visitados. Podes adicioná-lo outra vez mais tarde."
        confirmLabel="Remover"
        destructive
        onCancel={() => setPendingRemoveCountry(null)}
        onConfirm={confirmRemoveCountry}
      />
    </div>
  );
}
