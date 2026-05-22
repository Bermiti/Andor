'use client';
import { useState, useEffect } from 'react';
import styles from './ClimateCalendar.module.css';

// Monthly climate & crowd level database for our core destinations
const climateDatabase = {
  'lisbon': [
    { month: 'Jan', temp: '15°C', status: 'rainy', label: 'Rainy' },
    { month: 'Feb', temp: '16°C', status: 'rainy', label: 'Rainy' },
    { month: 'Mar', temp: '18°C', status: 'mild', label: 'Mild' },
    { month: 'Apr', temp: '20°C', status: 'best', label: 'Best Time' },
    { month: 'May', temp: '22°C', status: 'best', label: 'Best Time' },
    { month: 'Jun', temp: '26°C', status: 'best', label: 'Best Time' },
    { month: 'Jul', temp: '28°C', status: 'hot', label: 'Peak/Hot' },
    { month: 'Aug', temp: '29°C', status: 'hot', label: 'Peak/Hot' },
    { month: 'Sep', temp: '27°C', status: 'best', label: 'Best Time' },
    { month: 'Oct', temp: '23°C', status: 'best', label: 'Best Time' },
    { month: 'Nov', temp: '18°C', status: 'mild', label: 'Mild' },
    { month: 'Dec', temp: '15°C', status: 'rainy', label: 'Rainy' },
  ],
  'barcelona': [
    { month: 'Jan', temp: '14°C', status: 'rainy', label: 'Rainy' },
    { month: 'Feb', temp: '15°C', status: 'rainy', label: 'Rainy' },
    { month: 'Mar', temp: '17°C', status: 'mild', label: 'Mild' },
    { month: 'Apr', temp: '19°C', status: 'best', label: 'Best Time' },
    { month: 'May', temp: '22°C', status: 'best', label: 'Best Time' },
    { month: 'Jun', temp: '26°C', status: 'best', label: 'Best Time' },
    { month: 'Jul', temp: '29°C', status: 'hot', label: 'Peak/Hot' },
    { month: 'Aug', temp: '30°C', status: 'hot', label: 'Peak/Hot' },
    { month: 'Sep', temp: '27°C', status: 'best', label: 'Best Time' },
    { month: 'Oct', temp: '23°C', status: 'best', label: 'Best Time' },
    { month: 'Nov', temp: '17°C', status: 'mild', label: 'Mild' },
    { month: 'Dec', temp: '14°C', status: 'rainy', label: 'Rainy' },
  ],
  'paris': [
    { month: 'Jan', temp: '7°C', status: 'rainy', label: 'Cold/Rain' },
    { month: 'Feb', temp: '8°C', status: 'rainy', label: 'Cold/Rain' },
    { month: 'Mar', temp: '12°C', status: 'mild', label: 'Mild' },
    { month: 'Apr', temp: '16°C', status: 'best', label: 'Best Time' },
    { month: 'May', temp: '20°C', status: 'best', label: 'Best Time' },
    { month: 'Jun', temp: '23°C', status: 'best', label: 'Best Time' },
    { month: 'Jul', temp: '25°C', status: 'hot', label: 'Peak/Hot' },
    { month: 'Aug', temp: '25°C', status: 'hot', label: 'Peak/Hot' },
    { month: 'Sep', temp: '21°C', status: 'best', label: 'Best Time' },
    { month: 'Oct', temp: '16°C', status: 'mild', label: 'Mild' },
    { month: 'Nov', temp: '11°C', status: 'rainy', label: 'Cold/Rain' },
    { month: 'Dec', temp: '8°C', status: 'rainy', label: 'Cold/Rain' },
  ],
  'tokyo': [
    { month: 'Jan', temp: '10°C', status: 'rainy', label: 'Cold' },
    { month: 'Feb', temp: '10°C', status: 'rainy', label: 'Cold' },
    { month: 'Mar', temp: '13°C', status: 'best', label: 'Cherry Blossom' },
    { month: 'Apr', temp: '19°C', status: 'best', label: 'Best Time' },
    { month: 'May', temp: '23°C', status: 'best', label: 'Best Time' },
    { month: 'Jun', temp: '26°C', status: 'rainy', label: 'Monsoon' },
    { month: 'Jul', temp: '29°C', status: 'hot', label: 'Hot/Humid' },
    { month: 'Aug', temp: '31°C', status: 'hot', label: 'Hot/Humid' },
    { month: 'Sep', temp: '27°C', status: 'mild', label: 'Mild' },
    { month: 'Oct', temp: '22°C', status: 'best', label: 'Autumn Foliage' },
    { month: 'Nov', temp: '17°C', status: 'best', label: 'Autumn Foliage' },
    { month: 'Dec', temp: '12°C', status: 'rainy', label: 'Cold' },
  ],
  'switzerland': [
    { month: 'Jan', temp: '2°C', status: 'rainy', label: 'Snow/Ski' },
    { month: 'Feb', temp: '3°C', status: 'rainy', label: 'Snow/Ski' },
    { month: 'Mar', temp: '8°C', status: 'mild', label: 'Mild' },
    { month: 'Apr', temp: '12°C', status: 'mild', label: 'Mild' },
    { month: 'May', temp: '17°C', status: 'best', label: 'Best Time' },
    { month: 'Jun', temp: '21°C', status: 'best', label: 'Best Time' },
    { month: 'Jul', temp: '24°C', status: 'best', label: 'Peak/Warm' },
    { month: 'Aug', temp: '23°C', status: 'best', label: 'Peak/Warm' },
    { month: 'Sep', temp: '19°C', status: 'best', label: 'Best Time' },
    { month: 'Oct', temp: '14°C', status: 'mild', label: 'Mild' },
    { month: 'Nov', temp: '8°C', status: 'rainy', label: 'Cold/Rain' },
    { month: 'Dec', temp: '3°C', status: 'rainy', label: 'Snow/Ski' },
  ],
  'azores': [
    { month: 'Jan', temp: '16°C', status: 'rainy', label: 'Rainy' },
    { month: 'Feb', temp: '16°C', status: 'rainy', label: 'Rainy' },
    { month: 'Mar', temp: '16°C', status: 'rainy', label: 'Rainy' },
    { month: 'Apr', temp: '17°C', status: 'mild', label: 'Mild' },
    { month: 'May', temp: '19°C', status: 'best', label: 'Best Time' },
    { month: 'Jun', temp: '21°C', status: 'best', label: 'Best Time' },
    { month: 'Jul', temp: '24°C', status: 'best', label: 'Peak/Best' },
    { month: 'Aug', temp: '25°C', status: 'best', label: 'Peak/Best' },
    { month: 'Sep', temp: '24°C', status: 'best', label: 'Best Time' },
    { month: 'Oct', temp: '21°C', status: 'mild', label: 'Mild' },
    { month: 'Nov', temp: '19°C', status: 'rainy', label: 'Rainy' },
    { month: 'Dec', temp: '17°C', status: 'rainy', label: 'Rainy' },
  ],
  'bali': [
    { month: 'Jan', temp: '31°C', status: 'rainy', label: 'Wet Season' },
    { month: 'Feb', temp: '31°C', status: 'rainy', label: 'Wet Season' },
    { month: 'Mar', temp: '31°C', status: 'mild', label: 'Transition' },
    { month: 'Apr', temp: '32°C', status: 'best', label: 'Best Time' },
    { month: 'May', temp: '32°C', status: 'best', label: 'Best Time' },
    { month: 'Jun', temp: '31°C', status: 'best', label: 'Best Time' },
    { month: 'Jul', temp: '30°C', status: 'best', label: 'Peak/Dry' },
    { month: 'Aug', temp: '30°C', status: 'best', label: 'Peak/Dry' },
    { month: 'Sep', temp: '31°C', status: 'best', label: 'Best Time' },
    { month: 'Oct', temp: '31°C', status: 'mild', label: 'Transition' },
    { month: 'Nov', temp: '31°C', status: 'rainy', label: 'Wet Season' },
    { month: 'Dec', temp: '31°C', status: 'rainy', label: 'Wet Season' },
  ],
  'new york': [
    { month: 'Jan', temp: '4°C', status: 'rainy', label: 'Cold/Snow' },
    { month: 'Feb', temp: '6°C', status: 'rainy', label: 'Cold/Snow' },
    { month: 'Mar', temp: '10°C', status: 'mild', label: 'Mild' },
    { month: 'Apr', temp: '16°C', status: 'best', label: 'Best Time' },
    { month: 'May', temp: '22°C', status: 'best', label: 'Best Time' },
    { month: 'Jun', temp: '27°C', status: 'hot', label: 'Warm' },
    { month: 'Jul', temp: '29°C', status: 'hot', label: 'Hot/Humid' },
    { month: 'Aug', temp: '29°C', status: 'hot', label: 'Hot/Humid' },
    { month: 'Sep', temp: '24°C', status: 'best', label: 'Best Time' },
    { month: 'Oct', temp: '18°C', status: 'best', label: 'Best Time' },
    { month: 'Nov', temp: '12°C', status: 'mild', label: 'Mild' },
    { month: 'Dec', temp: '6°C', status: 'best', label: 'Holiday Season' },
  ]
};

const defaultClimate = [
  { month: 'Jan', temp: '12°C', status: 'mild', label: 'Mild' },
  { month: 'Feb', temp: '13°C', status: 'mild', label: 'Mild' },
  { month: 'Mar', temp: '15°C', status: 'mild', label: 'Mild' },
  { month: 'Apr', temp: '18°C', status: 'best', label: 'Best Time' },
  { month: 'May', temp: '21°C', status: 'best', label: 'Best Time' },
  { month: 'Jun', temp: '25°C', status: 'best', label: 'Best Time' },
  { month: 'Jul', temp: '28°C', status: 'hot', label: 'Peak/Hot' },
  { month: 'Aug', temp: '28°C', status: 'hot', label: 'Peak/Hot' },
  { month: 'Sep', temp: '25°C', status: 'best', label: 'Best Time' },
  { month: 'Oct', temp: '20°C', status: 'best', label: 'Best Time' },
  { month: 'Nov', temp: '16°C', status: 'mild', label: 'Mild' },
  { month: 'Dec', temp: '13°C', status: 'mild', label: 'Mild' },
];

export default function ClimateCalendar({ destination = '' }) {
  const [data, setData] = useState(defaultClimate);

  useEffect(() => {
    const key = destination.toLowerCase();
    let found = null;
    for (const [k, v] of Object.entries(climateDatabase)) {
      if (key.includes(k)) {
        found = v;
        break;
      }
    }
    if (found) {
      setData(found);
    } else {
      setData(defaultClimate);
    }
  }, [destination]);

  return (
    <div className={styles.calendarCard}>
      <h3 className={styles.title}>📅 Best Time to Visit</h3>
      <p className={styles.subtitle}>Monthly climate & season overview for your destination.</p>
      
      <div className={styles.grid}>
        {data.map((m, idx) => (
          <div key={idx} className={`${styles.monthBox} ${styles[m.status]}`} title={`${m.month}: ${m.temp} - ${m.label}`}>
            <span className={styles.monthName}>{m.month}</span>
            <span className={styles.temp}>{m.temp}</span>
            <span className={styles.badge}>{m.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.best}`}></span>
          <span>Recommended ✨</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.mild}`}></span>
          <span>Shoulder / Mild</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.hot}`}></span>
          <span>Peak Season (Hot/Crowded)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.rainy}`}></span>
          <span>Low Season (Rain/Cold)</span>
        </div>
      </div>
    </div>
  );
}
