'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './features.module.css';

const features = [
  {
    title: 'Roteiros prontos a usar',
    text: 'Dias organizados por ritmo, zona e energia, com tempos realistas entre paragens.',
  },
  {
    title: 'Orçamento que ajuda decisões',
    text: 'Sugestões alinhadas com o intervalo de gasto, com custos por dia e prioridades claras.',
  },
  {
    title: 'Dossier para levar ou vender',
    text: 'Transforma o plano num PDF partilhável para viajantes, amigos ou clientes.',
  },
];

export default function FeaturesPage() {
  useEffect(() => {
    document.title = 'Funcionalidades · Andor';
  }, []);

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div>
            <p className={styles.kicker}>Funcionalidades</p>
            <h1>Da ideia solta ao plano pronto.</h1>
            <p>
              O Andor junta perguntas certas, planeamento por IA, estimativas, pesquisa externa e uma
              apresentação limpa para transformar intenção em viagem.
            </p>
          </div>
          <aside className={styles.summaryCard}>
            <span>Foco principal</span>
            <strong>Roteiro operacional</strong>
            <p>Uma entrada simples para sair com decisões, prioridades e próximos passos.</p>
          </aside>
        </section>

        <section className={styles.featureGrid} aria-label="Funcionalidades principais">
          {features.map(({ title, text }, index) => (
            <article key={title} className={styles.featureCard}>
              <span className={styles.iconWrap}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </section>

        <section className={styles.cta}>
          <div>
            <h2>Constrói a próxima viagem.</h2>
            <p>Começa por destino, ritmo ou uma ideia vaga. O wizard transforma o resto em plano.</p>
          </div>
          <Link href="/itineraries">
            Criar viagem
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
