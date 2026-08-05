'use client';

import { ShieldCheck, Compass, SlidersHorizontal, Map, Lock } from 'lucide-react';
import styles from './HomeValueProp.module.css';

export default function HomeValueProp() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.tag}>Porquê a Andor?</span>
          <h2 className={styles.title}>Mais do que um chatbot. Um motor de viagem real.</h2>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.iconBox}><Compass size={22} /></div>
            <h3 className={styles.cardTitle}>Linguagem Natural + Confirmação</h3>
            <p className={styles.cardDesc}>
              Começa com uma frase simples. A Andor extrai o destino, duração e orçamento, pedindo apenas confirmação rápida.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.iconBox}><Map size={22} /></div>
            <h3 className={styles.cardTitle}>Geografia & Transportes Reais</h3>
            <p className={styles.cardDesc}>
              Coordenadas verificadas, cálculo de tempos de viagem reais e previsão meteorológica sem alucinações.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.iconBox}><SlidersHorizontal size={22} /></div>
            <h3 className={styles.cardTitle}>Edição Inline & Controlo Total</h3>
            <p className={styles.cardDesc}>
              Muda horários, troca restaurantes, remove atrações ou pede um plano para a chuva com 1 clique e opção de desfazer.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.iconBox}><Lock size={22} /></div>
            <h3 className={styles.cardTitle}>Privacidade & Persistência na Nuvem</h3>
            <p className={styles.cardDesc}>
              As tuas viagens ficam salvas na tua conta com segurança RLS no Supabase. Sem rastreios invasivos nem venda de dados.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
