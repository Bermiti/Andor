'use client';

import { CloudRain, Route, WalletCards } from 'lucide-react';
import { backupTriggerLabel } from '../lib/planning-labels';
import styles from './BackupPlansSection.module.css';

function legacyBackups(contingencyPlans = {}) {
  return [
    contingencyPlans.rainyDay && {
      id: 'bad_weather',
      trigger: 'Mau tempo',
      replacementPlan: contingencyPlans.rainyDay,
      costImpact: 'Confirmar',
      timeImpact: 'Mesmo bloco do dia',
      moveOrCancel: 'Mover atividades exteriores',
      practicalNote: '',
      clientFacing: contingencyPlans.rainyDay,
    },
    contingencyPlans.delayRecovery && {
      id: 'flight_delay',
      trigger: 'Atraso na chegada',
      replacementPlan: contingencyPlans.delayRecovery,
      costImpact: 'Confirmar',
      timeImpact: 'Mover primeiro bloco flexivel',
      moveOrCancel: 'Mover paragens opcionais',
      practicalNote: '',
      clientFacing: contingencyPlans.delayRecovery,
    },
    contingencyPlans.tiredDay && {
      id: 'tired_day',
      trigger: 'Dia cansativo',
      replacementPlan: contingencyPlans.tiredDay,
      costImpact: 'Tende a reduzir',
      timeImpact: 'Liberta tempo',
      moveOrCancel: 'Cortar extras',
      practicalNote: '',
      clientFacing: contingencyPlans.tiredDay,
    },
    contingencyPlans.lowerBudget && {
      id: 'lower_budget',
      trigger: 'Budget menor',
      replacementPlan: contingencyPlans.lowerBudget,
      costImpact: 'Reduz custo',
      timeImpact: 'Pode aumentar deslocacoes',
      moveOrCancel: 'Trocar pagos por gratuitos',
      practicalNote: '',
      clientFacing: contingencyPlans.lowerBudget,
    },
  ].filter(Boolean);
}

function normalizePlan(item, index) {
  return {
    id: item?.id || `backup-${index + 1}`,
    category: item?.category || 'general',
    severity: item?.severity || 'medium',
    trigger: backupTriggerLabel(item),
    replacementPlan: item?.replacementPlan || item?.plan || item?.description || '',
    costImpact: item?.costImpact || item?.cost || 'Confirmar impacto',
    timeImpact: item?.timeImpact || item?.timing || 'Confirmar impacto',
    moveOrCancel: item?.moveOrCancel || item?.whatToCancel || 'Mover opcionais primeiro',
    practicalNote: item?.practicalNote || item?.note || '',
    clientFacing: item?.clientFacing || item?.clientFacingVersion || item?.replacementPlan || '',
    sourceReason: item?.sourceReason || item?.reason || '',
  };
}

function severityLabel(severity) {
  if (severity === 'high') return 'Alta';
  if (severity === 'low') return 'Baixa';
  return 'Média';
}

function categoryLabel(category) {
  return ({
    general: 'Geral',
    weather: 'Clima',
    arrival: 'Chegada',
    hotel: 'Hotel',
    activities: 'Atividades',
    food: 'Refeições',
    pace: 'Ritmo',
    budget: 'Orçamento',
    transport: 'Transporte',
    accessibility: 'Acessibilidade',
    company: 'Empresa',
  })[category] || category;
}

export default function BackupPlansSection({ backupPlans, contingencyPlans }) {
  const sourceItems = Array.isArray(backupPlans?.items)
    ? backupPlans.items
    : Array.isArray(backupPlans)
      ? backupPlans
      : legacyBackups(contingencyPlans);
  const items = sourceItems.map(normalizePlan);

  if (items.length === 0) {
    return (
      <section className={styles.empty} aria-label="Planos alternativos">
        <CloudRain size={22} aria-hidden="true" />
        <p>Planos alternativos a preparar...</p>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-label="Planos alternativos">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            <Route size={22} aria-hidden="true" />
            Planos alternativos
          </h2>
          <p className={styles.subtitle}>Trocas práticas para clima, atrasos, lotação, transporte e mudanças de agenda.</p>
        </div>
        <span className={styles.count}>{items.length}</span>
      </div>

      <div className={styles.list}>
        {items.map((item) => (
          <details key={item.id} className={styles.plan}>
            <summary className={styles.planHeader}>
              <div>
                <span className={styles.category}>{categoryLabel(item.category)}</span>
                <h3>{item.trigger}</h3>
              </div>
              <span className={`${styles.severity} ${styles[item.severity] || styles.medium}`}>
                {severityLabel(item.severity)}
              </span>
            </summary>

            <div className={styles.planBody}>
              <p className={styles.replacement}>{item.replacementPlan}</p>

              <div className={styles.impactGrid}>
                <div>
                  <WalletCards size={14} aria-hidden="true" />
                  <span>Custo</span>
                  <strong>{item.costImpact}</strong>
                </div>
                <div>
                  <CloudRain size={14} aria-hidden="true" />
                  <span>Tempo</span>
                  <strong>{item.timeImpact}</strong>
                </div>
              </div>

              <dl className={styles.detailList}>
                <div>
                  <dt>Mover/cancelar</dt>
                  <dd>{item.moveOrCancel}</dd>
                </div>
                {item.practicalNote && (
                  <div>
                    <dt>Nota prática</dt>
                    <dd>{item.practicalNote}</dd>
                  </div>
                )}
                {item.clientFacing && (
                  <div>
                    <dt>Versão cliente</dt>
                    <dd>{item.clientFacing}</dd>
                  </div>
                )}
              </dl>

              {item.sourceReason && <p className={styles.source}>{item.sourceReason}</p>}
            </div>
          </details>
        ))}
      </div>

      {backupPlans?.notes && <p className={styles.note}>{backupPlans.notes}</p>}
    </section>
  );
}
