'use client';

import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CreationWizard from '../components/CreationWizard';
import styles from './itineraries.module.css';

const inspiration = [
  {
    city: 'Lisboa',
    destination: 'Lisboa, Portugal',
    line: 'Miradouros ao fim da tarde, bairros antigos e refeições sem pressa.',
  },
  {
    city: 'Tóquio',
    destination: 'Tokyo, Japan',
    line: 'Bairros contrastantes, comida local e dias organizados por energia.',
  },
  {
    city: 'Roma',
    destination: 'Rome, Italy',
    line: 'História, trattorias e pausas bem colocadas entre grandes clássicos.',
  },
];

const steps = [
  {
    title: 'Dizes-nos o essencial',
    text: 'Destino, datas, orçamento, ritmo e quem viaja contigo.',
  },
  {
    title: 'Afinamos o estilo',
    text: 'O wizard ajuda-te a escolher interesses e prioridades sem complicar.',
  },
  {
    title: 'Recebes um roteiro',
    text: 'Dias organizados, custos, alternativas e sugestões com contexto.',
  },
];

export default function ItinerariesPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [wizardDestination, setWizardDestination] = useState('');
  const exampleRef = useRef(null);

  useEffect(() => {
    document.title = 'Criar viagem · Andor';
  }, []);

  const openWizard = (prefilledDestination = destination) => {
    setWizardDestination(prefilledDestination);
    setIsWizardOpen(true);
  };

  const scrollToExample = () => {
    exampleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.kicker}>Build my trip</p>
            <h1>Constrói a tua viagem com o Andor.</h1>
            <p className={styles.lead}>
              Começa com uma ideia simples. O Andor transforma-a num roteiro personalizado
              com ritmo, orçamento, interesses e detalhes que fazem sentido para ti.
            </p>

            <div className={styles.tripBox} aria-label="Começar uma viagem">
              <label htmlFor="build-trip-destination">Para onde queres ir?</label>
              <div className={styles.inputRow}>
                <input
                  id="build-trip-destination"
                  data-testid="build-trip-destination"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Ex: Lisboa, Tóquio, Roma..."
                />
                <button type="button" onClick={() => openWizard()} data-testid="build-trip-primary">
                  Criar viagem
                </button>
              </div>
            </div>

            <div className={styles.heroActions}>
              <button type="button" className={styles.secondaryAction} onClick={scrollToExample}>
                Ver exemplo
              </button>
              <span>Demora menos de um minuto a começar.</span>
            </div>
          </div>

          <aside className={styles.previewCard} aria-label="Pré-visualização do roteiro">
            <div className={styles.previewTop}>
              <div>
                <span>Roteiro exemplo</span>
                <h2>Lisboa em 4 dias</h2>
              </div>
              <span className={styles.previewBadge}>4 dias</span>
            </div>
            <p>Miradouros, petiscos locais e bairros antigos sem correr de um lado para o outro.</p>
            <div className={styles.previewMeta}>
              <span>Ritmo equilibrado</span>
              <span>Cerca de 80€/dia</span>
              <span>Alternativas se chover</span>
            </div>
            <div className={styles.dayList}>
              <div>
                <strong>Dia 1</strong>
                <span>Baixa, Chiado e jantar em Alfama</span>
              </div>
              <div>
                <strong>Dia 2</strong>
                <span>Belém, MAAT e sunset junto ao Tejo</span>
              </div>
              <div>
                <strong>Dia 3</strong>
                <span>Sintra com regresso calmo a Lisboa</span>
              </div>
            </div>
          </aside>
        </section>

        <section className={styles.stepsSection}>
          {steps.map(({ title, text }, index) => (
            <div className={styles.stepCard} key={title}>
              <div className={styles.stepHeader}>
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          ))}
        </section>

        <section className={styles.exampleSection} ref={exampleRef}>
          <div>
            <p className={styles.kicker}>O que recebes</p>
            <h2>Um roteiro que parece pensado por alguém que ouviu.</h2>
          </div>
          <div className={styles.exampleGrid}>
            <div className={styles.examplePanel}>
              <span>Manhã</span>
              <strong>Começo leve</strong>
              <p>Café local, caminhada curta e primeira paragem sem filas desnecessárias.</p>
            </div>
            <div className={styles.examplePanel}>
              <span>Tarde</span>
              <strong>Contexto e pausa</strong>
              <p>Dois pontos principais, tempo para almoço e uma alternativa mais calma.</p>
            </div>
            <div className={styles.examplePanel}>
              <span>Noite</span>
              <strong>Fecho com intenção</strong>
              <p>Jantar adequado ao orçamento e sugestões próximas para continuar.</p>
            </div>
          </div>
        </section>

        <section className={styles.inspirationSection}>
          <div className={styles.sectionIntro}>
            <p className={styles.kicker}>Inspiração rápida</p>
            <h2>Escolhe um ponto de partida.</h2>
          </div>
          <div className={styles.inspirationGrid}>
            {inspiration.map((item) => (
              <article key={item.city} className={styles.destinationCard}>
                <div>
                  <h3>{item.city}</h3>
                  <p>{item.line}</p>
                </div>
                <button type="button" onClick={() => openWizard(item.destination)} data-testid={`plan-${item.city.toLowerCase()}`}>
                  Planear
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.finalCta}>
          <div>
            <p className={styles.kicker}>Pronto quando tu estiveres</p>
            <h2>Começa com uma ideia simples.</h2>
            <p>O Andor transforma-a num roteiro pensado para a tua forma de viajar.</p>
          </div>
          <button type="button" onClick={() => openWizard()} data-testid="build-trip-final">
            Criar viagem
          </button>
        </section>
      </main>
      <Footer />
      <CreationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        initialDestination={wizardDestination}
        initialStep={1}
      />
    </>
  );
}
