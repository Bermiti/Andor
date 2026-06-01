'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './features.module.css';

const features = [
  {
    title: 'Roteiros com intenção',
    text: 'Dias organizados por ritmo, zona e energia, com tempo realista entre paragens.',
  },
  {
    title: 'Orçamento visível',
    text: 'Sugestões alinhadas com o teu intervalo de gasto, sem perder contexto local.',
  },
  {
    title: 'IA que pergunta melhor',
    text: 'Quando falta informação, o Andor ajuda-te a afinar destino, datas e estilo.',
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
            <h1>Menos pesquisa. Mais viagem.</h1>
            <p>
              O Andor junta perguntas certas, planeamento por IA e uma apresentação limpa
              para transformar uma ideia solta num roteiro útil.
            </p>
          </div>
          <aside className={styles.summaryCard}>
            <span>Foco principal</span>
            <strong>Criar viagem</strong>
            <p>Uma entrada simples para construir um plano personalizado desde o primeiro clique.</p>
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
            <h2>Constrói a tua próxima viagem.</h2>
            <p>Começa por destino, ritmo ou uma ideia vaga. O wizard trata do resto.</p>
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
