'use client';

import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import styles from './InsuranceSelector.module.css';

export default function InsuranceSelector({ tripDays, passengers = 2, selectedInsurance, onSelectInsurance }) {
  const getInsuranceOptions = () => {
    return [
      {
        id: 'ins-standard',
        name: 'Seguro Standard (IATI)',
        description: 'Cobertura médica básica, cancelamentos de voos e perda de bagagem.',
        medicalLimit: '€100.000',
        dailyCostCents: 220,
        icon: Shield,
        badge: null,
      },
      {
        id: 'ins-premium',
        name: 'Seguro Premium (Allianz)',
        description: 'Cobertura médica alargada, assistência jurídica e desportos de aventura.',
        medicalLimit: '€500.000',
        dailyCostCents: 390,
        icon: ShieldCheck,
        badge: 'Recomendado',
      },
      {
        id: 'ins-business',
        name: 'Seguro Business Executivo',
        description: 'Repatriação ilimitada, danos em equipamento tecnológico de trabalho e flexibilidade total de datas.',
        medicalLimit: 'Ilimitado',
        dailyCostCents: 650,
        icon: ShieldAlert,
        badge: 'Negócios',
      },
    ];
  };

  const options = getInsuranceOptions();
  const formatPrice = (cents) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  };

  return (
    <div className={styles.container}>
      <span className={styles.eyebrow}>Tranquilidade Andor</span>
      <h3>Proteger Viagem com Seguro</h3>
      <p className={styles.description}>Planos de proteção de viagem parceiros para as tuas necessidades de segurança e saúde.</p>

      <div className={styles.grid}>
        {options.map((opt) => {
          const totalCostCents = opt.dailyCostCents * tripDays * passengers;
          const isSelected = selectedInsurance?.id === opt.id;
          const Icon = opt.icon;

          return (
            <div
              key={opt.id}
              className={`${styles.card} ${isSelected ? styles.cardActive : ''}`}
              onClick={() => onSelectInsurance(isSelected ? null : { ...opt, totalCostCents })}
            >
              {opt.badge && <span className={styles.badge}>{opt.badge}</span>}
              <div className={styles.header}>
                <div className={styles.iconContainer}>
                  <Icon size={20} className={isSelected ? styles.iconActive : styles.icon} />
                </div>
                <div>
                  <strong>{opt.name}</strong>
                  <span className={styles.limit}>Médico: {opt.medicalLimit}</span>
                </div>
              </div>
              <p className={styles.cardDesc}>{opt.description}</p>
              <div className={styles.priceRow}>
                <div>
                  <span className={styles.daily}>{formatPrice(opt.dailyCostCents)} / dia</span>
                </div>
                <div className={styles.totalGroup}>
                  <span className={styles.totalLabel}>Total ({tripDays} dias, {passengers} pax)</span>
                  <strong className={styles.total}>{formatPrice(totalCostCents)}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
