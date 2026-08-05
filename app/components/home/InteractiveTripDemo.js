'use client';

import { useState } from 'react';
import { MapPin, Calendar, Clock, Sparkles, Check, ChevronRight, Utensils, Compass, RefreshCw } from 'lucide-react';
import StageNavigator from '../StageNavigator';
import RecommendationCard from '../RecommendationCard';
import styles from './InteractiveTripDemo.module.css';

const DEMO_STAGES = [
  { id: 'stage-1', destination: { canonicalName: 'Roma' }, nights: 3, arrivalDate: '2026-09-10', departureDate: '2026-09-13' },
  { id: 'stage-2', destination: { canonicalName: 'Florença' }, nights: 2, arrivalDate: '2026-09-13', departureDate: '2026-09-15' },
];

const DEMO_DAYS = [
  {
    dayNumber: 1,
    title: 'Dia 1: Chegada & Centro Histórico de Roma',
    activities: [
      { id: 'act-1', name: 'Almoço na Trattoria Da Enzo', period: 'lunch', category: 'restaurant', cost: 25, time: '13:00', duration: 90, notes: 'Famoso pela Carbonara autêntica em Trastevere.' },
      { id: 'act-2', name: 'Visita Guiada ao Coliseu & Fórum Romano', period: 'afternoon', category: 'monument', cost: 18, time: '15:30', duration: 120, notes: 'Bilhete com acesso prioritário reservado.' },
      { id: 'act-3', name: 'Passeio pela Piazza Navona & Jantar', period: 'dinner', category: 'restaurant', cost: 35, time: '20:00', duration: 120, notes: 'Jantar ao ar livre perto da Fonte dos Quatro Rios.' },
    ],
  },
  {
    dayNumber: 2,
    title: 'Dia 2: Museus do Vaticano & Panteão',
    activities: [
      { id: 'act-4', name: 'Capela Sistina & Museus do Vaticano', period: 'morning', category: 'museum', cost: 22, time: '09:00', duration: 180, notes: 'Entrada matinal recomendada para evitar filas.' },
      { id: 'act-5', name: 'Gelato artesanal na Gelateria del Teatro', period: 'afternoon', category: 'cafe', cost: 4, time: '14:30', duration: 30, notes: 'Melhor gelato perto do Rio Tibre.' },
      { id: 'act-6', name: 'Panteão de Agrippa ao Pôr do Sol', period: 'afternoon', category: 'monument', cost: 5, time: '17:00', duration: 60, notes: 'Luz natural espetacular através do óculo.' },
    ],
  },
];

const DEMO_RECOMMENDATION = {
  id: 'rec-demo-1',
  name: 'Café Sant\'Eustachio Il Caffè',
  category: 'cafe',
  justification: 'Famoso pelo melhor espresso de Roma, a 3 min a pé do Panteão.',
  estimatedCost: 3,
  estimatedDuration: 20,
  distance: 0.2,
  context: 'near_you',
};

export default function InteractiveTripDemo() {
  const [activeStageId, setActiveStageId] = useState('stage-1');
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [savedRecs, setSavedRecs] = useState([]);
  const [activities, setActivities] = useState(DEMO_DAYS[0].activities);

  const handleSelectStage = (stageId) => {
    setActiveStageId(stageId);
    if (stageId === 'stage-2') {
      setActiveDayIdx(1);
      setActivities(DEMO_DAYS[1].activities);
    } else {
      setActiveDayIdx(0);
      setActivities(DEMO_DAYS[0].activities);
    }
  };

  const handleAddRec = (rec) => {
    if (savedRecs.includes(rec.id)) return;
    setSavedRecs([...savedRecs, rec.id]);
    setActivities([
      ...activities,
      {
        id: rec.id,
        name: rec.name,
        period: 'afternoon',
        category: rec.category,
        cost: rec.estimatedCost,
        time: '16:00',
        duration: rec.estimatedDuration,
        notes: rec.justification,
      },
    ]);
  };

  const currentDay = DEMO_DAYS[activeDayIdx];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <span className={styles.tag}>Demonstração Real do Produto</span>
          <h2 className={styles.title}>Experimenta a Interface da Andor</h2>
          <p className={styles.subtitle}>
            Um itinerário estruturado por dias e etapas, com mutações em tempo real e recomendações contextuais.
          </p>
        </div>

        <div className={styles.demoWindow}>
          {/* Stage Navigator Bar */}
          <div className={styles.stageBar}>
            <StageNavigator
              stages={DEMO_STAGES}
              activeStageId={activeStageId}
              onStageSelect={handleSelectStage}
            />
          </div>

          {/* Main Demo Layout */}
          <div className={styles.demoContent}>
            {/* Timeline Area */}
            <div className={styles.timelineArea}>
              <div className={styles.dayTitleRow}>
                <Calendar size={18} className={styles.dayIcon} />
                <h3 className={styles.dayTitle}>{currentDay.title}</h3>
              </div>

              <div className={styles.activitiesList}>
                {activities.map((act) => (
                  <div key={act.id} className={styles.activityCard}>
                    <div className={styles.timeBadge}>
                      <Clock size={14} />
                      <span>{act.time}</span>
                    </div>
                    <div className={styles.actMain}>
                      <div className={styles.actName}>{act.name}</div>
                      <div className={styles.actNotes}>{act.notes}</div>
                    </div>
                    <div className={styles.actPrice}>{act.cost ? `€${act.cost}` : 'Grátis'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contextual Sidebar / Recommendation Demo */}
            <div className={styles.sidebarArea}>
              <div className={styles.sidebarHeader}>
                <Sparkles size={16} className={styles.sparkleIcon} />
                <span>Recomendação Contextual Perto de Si</span>
              </div>
              <RecommendationCard
                recommendation={DEMO_RECOMMENDATION}
                currency="€"
                onAdd={handleAddRec}
                onSave={() => {}}
                onReject={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
