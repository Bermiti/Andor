'use client';

import { useState } from 'react';
import { Sparkles, ArrowRight, Search, Compass, MapPin } from 'lucide-react';
import CreationExperience from '../CreationExperience';
import styles from './HomeHero.module.css';

const QUICK_PROMPTS = [
  '5 dias em Itália com praia e boa comida',
  'Fim de semana romântico em Roma',
  '7 dias na Escócia em família com natureza',
  'Praia, gastronomia e descanso nos Açores',
];

export default function HomeHero() {
  const [inputText, setInputText] = useState('');
  const [isExperienceOpen, setIsExperienceOpen] = useState(false);
  const [activePrompt, setActivePrompt] = useState('');

  const handleOpenWithText = (text) => {
    setActivePrompt(text);
    setIsExperienceOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleOpenWithText(inputText);
  };

  return (
    <div className={styles.heroWrapper}>
      {/* Background Grid & Vignette */}
      <div className={styles.bgGrid}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={styles.gridImgWrapper}>
            <div className={styles.gridImg} style={{ backgroundColor: '#131f30' }} />
          </div>
        ))}
      </div>
      <div className={styles.bgOverlay} />

      {/* Main Editorial Hero Content */}
      <div className={styles.heroContainer}>
        <div className={styles.badge}>
          <Sparkles size={14} className={styles.badgeIcon} />
          <span>Inteligência de Viagem sem Formulários Extensos</span>
        </div>

        <h1 className={styles.mainTitle}>
          Planeia a tua viagem completa em minutos.<br />
          <span className={styles.highlightText}>Ajusta cada detalhe quando quiseres.</span>
        </h1>

        <p className={styles.subTitle}>
          Descreve o que pretendes em linguagem natural. A Andor organiza um itinerário completo com atividades, deslocações e orçamento.
        </p>

        {/* Natural Language Prompt Input */}
        <form className={styles.promptBox} onSubmit={handleSubmit}>
          <div className={styles.promptInputRow}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              className={styles.promptInput}
              placeholder="Ex: Quero viajar 5 dias para Itália com a minha namorada em setembro, com praia e boa comida..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" className={styles.submitBtn}>
              <span>Planear Viagem</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className={styles.quickPromptsRow}>
            <span className={styles.quickLabel}>Inspiração rápida:</span>
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                className={styles.quickChip}
                onClick={() => handleOpenWithText(prompt)}
              >
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </form>

        {/* Secondary Discovery Link */}
        <div className={styles.secondaryActions}>
          <button
            type="button"
            className={styles.discoveryBtn}
            onClick={() => handleOpenWithText('Ainda não sei o destino')}
          >
            <Compass size={16} />
            <span>Ainda não sabes o destino? Descobrir por estilo →</span>
          </button>
        </div>
      </div>

      {/* Hybrid Creation Experience Modal */}
      <CreationExperience
        isOpen={isExperienceOpen}
        onClose={() => setIsExperienceOpen(false)}
        initialText={activePrompt}
      />
    </div>
  );
}
