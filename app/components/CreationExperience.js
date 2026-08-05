'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  CreditCard,
  Compass,
  ArrowRight,
  Check,
  X,
  Sliders,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Info,
} from 'lucide-react';
import { parseNaturalLanguageIntent, buildConfirmationChips } from '../lib/natural-intent-parser';
import { getTravelPersona, updateTravelPersona } from '../lib/travel-persona';
import styles from './CreationExperience.module.css';

const PACE_OPTIONS = [
  { id: 'relaxed', label: 'Tranquilo & Calmo', desc: 'Menos locais por dia, mais tempo livre e refeições sem pressa' },
  { id: 'balanced', label: 'Equilibrado', desc: 'Ritmo ideal entre visitas marcantes e momentos espontâneos' },
  { id: 'fast', label: 'Intenso & Completo', desc: 'Maximiza o tempo para ver o maior número de pontos icónicos' },
];

const STYLE_OPTIONS = [
  { id: 'local_authentic', label: 'Autêntico & Local', desc: 'Bairros genuínos, tabernas locais e recantos fora do circuito' },
  { id: 'popular_highlights', label: 'Monumentos Icónicos', desc: 'Cartões postais imperdíveis, monumentos e atrações famosas' },
  { id: 'hidden_gems', label: 'Segredos Escondidos', desc: 'Lugares tranquilos, miradouros menos conhecidos e locais calmos' },
];

const BUDGET_OPTIONS = [
  { id: 'economic', label: 'Económico', desc: 'Otimizado para poupança sem prescindir de qualidade' },
  { id: 'moderate', label: 'Equilibrado', desc: 'Boa relação qualidade-preço em alojamento e restauração' },
  { id: 'luxury', label: 'Conforto Superior', desc: 'Alojamentos premium, refeições selecionadas e maior conforto' },
];

export default function CreationExperience({
  isOpen,
  onClose,
  initialText = '',
  initialDestination = '',
  onItineraryCreated,
}) {
  const [inputText, setInputText] = useState(initialText);
  const [intent, setIntent] = useState(null);
  const [step, setStep] = useState(1); // 1: Natural Intent & Chips, 2: Adaptive Choices, 3: Live Preview, 4: Generating
  const [editingChip, setEditingChip] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  // Initialize intent from initial input
  useEffect(() => {
    if (isOpen) {
      const textToParse = initialText || (initialDestination ? `Viagem para ${initialDestination}` : '');
      setInputText(textToParse);
      const parsed = parseNaturalLanguageIntent(textToParse);
      if (initialDestination && !parsed.destination) {
        parsed.destination = initialDestination;
      }
      setIntent(parsed);
      setStep(1);
      setErrorMsg('');
    }
  }, [isOpen, initialText, initialDestination]);

  if (!isOpen) return null;

  const handleTextChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    const parsed = parseNaturalLanguageIntent(text);
    setIntent(parsed);
  };

  const handleChipClick = (chipKey) => {
    setEditingChip(editingChip === chipKey ? null : chipKey);
  };

  const updateIntentField = (field, value) => {
    setIntent((prev) => ({
      ...prev,
      [field]: value,
    }));
    setEditingChip(null);
  };

  const handleProceedToAdapt = () => {
    if (!intent?.destination || !intent.destination.trim()) {
      setErrorMsg('Indica o destino da viagem antes de continuar.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleProceedToPreview = () => {
    setStep(3);
  };

  const handleGenerate = async () => {
    setStep(4);
    setErrorMsg('');

    try {
      // Save user choices to persona for progress learning
      updateTravelPersona({
        pace: intent.pace?.pace || 'balanced',
        budgetTier: intent.budget?.tier || 'moderate',
        interests: (intent.interests || []).map((i) => i.id),
      });

      const body = {
        destination: intent.destination,
        days: intent.durationDays || 5,
        travelStyle: intent.pace?.pace || 'balanced',
        budgetTier: intent.budget?.tier || 'moderate',
        stylesList: (intent.interests || []).map((i) => i.id),
        travelers: intent.travelers || { adults: 2, children: 0 },
        dates: intent.dates || null,
        generationIntent: {
          key: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          fingerprint: JSON.stringify(intent),
        },
      };

      const res = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message || data.message || 'Erro ao gerar o roteiro.');
      }

      const tripId = data.id || data.itinerary?.id;
      if (tripId) {
        if (onItineraryCreated) onItineraryCreated(data);
        window.location.href = `/itinerary/${tripId}`;
      } else {
        throw new Error('Nenhum identificador de viagem devolvido.');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao criar o roteiro. Tenta novamente.');
      setStep(3);
    }
  };

  const chips = buildConfirmationChips(intent);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Sparkles className={styles.sparkleIcon} size={20} />
            <span>Criar Viagem Personalizada</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressBar}>
          <div className={`${styles.progressStep} ${step >= 1 ? styles.active : ''}`} />
          <div className={`${styles.progressStep} ${step >= 2 ? styles.active : ''}`} />
          <div className={`${styles.progressStep} ${step >= 3 ? styles.active : ''}`} />
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className={styles.errorBanner}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Natural Intent & Chips */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <h2 className={styles.title}>Descreve a viagem que imaginas</h2>
            <p className={styles.subtitle}>
              Escreve como falares a um amigo. A Andor extrai automaticamente o destino, duração e preferências.
            </p>

            <div className={styles.inputWrapper}>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="Ex: Quero viajar 5 dias para Itália em casal em setembro, com foco em praia e boa comida..."
                value={inputText}
                onChange={handleTextChange}
                autoFocus
              />
            </div>

            {/* Extracted Chips Section */}
            <div className={styles.chipsSection}>
              <div className={styles.chipsTitle}>O que a Andor já percebeu:</div>
              <div className={styles.chipsGrid}>
                {chips.map((chip) => (
                  <div
                    key={chip.key}
                    className={`${styles.chip} ${styles[chip.type]} ${editingChip === chip.key ? styles.editing : ''}`}
                    onClick={() => handleChipClick(chip.key)}
                  >
                    <span>{chip.icon}</span>
                    <span className={styles.chipLabel}>{chip.label}</span>
                  </div>
                ))}
              </div>

              {/* Inline Chip Quick Editors */}
              {editingChip === 'destination' && (
                <div className={styles.quickEditor}>
                  <label>Destino:</label>
                  <input
                    type="text"
                    value={intent?.destination || ''}
                    onChange={(e) => updateIntentField('destination', e.target.value)}
                    placeholder="Cidade ou País"
                  />
                </div>
              )}

              {editingChip === 'durationDays' && (
                <div className={styles.quickEditor}>
                  <label>Número de Dias:</label>
                  <div className={styles.numSelector}>
                    {[3, 4, 5, 7, 10, 14].map((d) => (
                      <button
                        key={d}
                        className={intent?.durationDays === d ? styles.numActive : ''}
                        onClick={() => updateIntentField('durationDays', d)}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {editingChip === 'travelers' && (
                <div className={styles.quickEditor}>
                  <label>Companheiros:</label>
                  <div className={styles.optionRow}>
                    {[
                      { label: 'Casal', adults: 2, children: 0, type: 'couple' },
                      { label: 'Solo', adults: 1, children: 0, type: 'solo' },
                      { label: 'Família', adults: 2, children: 2, type: 'family' },
                      { label: 'Amigos', adults: 4, children: 0, type: 'friends' },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        className={intent?.travelers?.label === opt.label ? styles.numActive : ''}
                        onClick={() => updateIntentField('travelers', opt)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.actionsRow}>
              <button className={styles.primaryBtn} onClick={handleProceedToAdapt}>
                <span>Continuar e Ajustar Detalhes</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Adaptive Visual Choices */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <h2 className={styles.title}>Ajustes Rápidos</h2>
            <p className={styles.subtitle}>3 escolhas simples para afinar a tua experiência sem formulários longos.</p>

            {/* Choice 1: Pace */}
            <div className={styles.choiceGroup}>
              <div className={styles.groupLabel}>1. Qual é o ritmo ideal?</div>
              <div className={styles.cardsGrid}>
                {PACE_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    className={`${styles.selectCard} ${intent?.pace?.pace === opt.id ? styles.selectedCard : ''}`}
                    onClick={() => updateIntentField('pace', { pace: opt.id, label: opt.label })}
                  >
                    <div className={styles.cardHeader}>
                      <span className={styles.cardTitle}>{opt.label}</span>
                      {intent?.pace?.pace === opt.id && <Check size={16} className={styles.checkIcon} />}
                    </div>
                    <div className={styles.cardDesc}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Choice 2: Style */}
            <div className={styles.choiceGroup}>
              <div className={styles.groupLabel}>2. Que tipo de locais preferes?</div>
              <div className={styles.cardsGrid}>
                {STYLE_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    className={`${styles.selectCard} ${intent?.style === opt.id ? styles.selectedCard : ''}`}
                    onClick={() => updateIntentField('style', opt.id)}
                  >
                    <div className={styles.cardHeader}>
                      <span className={styles.cardTitle}>{opt.label}</span>
                      {intent?.style === opt.id && <Check size={16} className={styles.checkIcon} />}
                    </div>
                    <div className={styles.cardDesc}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Choice 3: Budget */}
            <div className={styles.choiceGroup}>
              <div className={styles.groupLabel}>3. Qual é o nível de orçamento?</div>
              <div className={styles.cardsGrid}>
                {BUDGET_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    className={`${styles.selectCard} ${intent?.budget?.tier === opt.id ? styles.selectedCard : ''}`}
                    onClick={() => updateIntentField('budget', { tier: opt.id, label: opt.label })}
                  >
                    <div className={styles.cardHeader}>
                      <span className={styles.cardTitle}>{opt.label}</span>
                      {intent?.budget?.tier === opt.id && <Check size={16} className={styles.checkIcon} />}
                    </div>
                    <div className={styles.cardDesc}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.actionsRow}>
              <button className={styles.secondaryBtn} onClick={() => setStep(1)}>
                Voltar
              </button>
              <button className={styles.primaryBtn} onClick={handleProceedToPreview}>
                <span>Ver Resumo da Viagem</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Live Preview Before Generation */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <h2 className={styles.title}>Resumo do Roteiro</h2>
            <p className={styles.subtitle}>Confirma os dados da viagem antes de dar início à geração.</p>

            <div className={styles.previewBox}>
              <div className={styles.previewHeader}>
                <MapPin size={18} className={styles.previewIcon} />
                <span className={styles.previewDest}>{intent?.destination}</span>
                <span className={styles.previewDays}>{intent?.durationDays} Dias</span>
              </div>

              <div className={styles.previewGrid}>
                <div className={styles.previewItem}>
                  <span className={styles.itemLabel}>Acompanhantes</span>
                  <span className={styles.itemVal}>{intent?.travelers?.label || 'Casal'}</span>
                </div>
                <div className={styles.previewItem}>
                  <span className={styles.itemLabel}>Orçamento</span>
                  <span className={styles.itemVal}>{intent?.budget?.label || 'Equilibrado'}</span>
                </div>
                <div className={styles.previewItem}>
                  <span className={styles.itemLabel}>Ritmo</span>
                  <span className={styles.itemVal}>{intent?.pace?.label || 'Equilibrado'}</span>
                </div>
                <div className={styles.previewItem}>
                  <span className={styles.itemLabel}>Interesses</span>
                  <span className={styles.itemVal}>
                    {intent?.interests?.length > 0 ? intent.interests.map((i) => i.label).join(', ') : 'Gerais'}
                  </span>
                </div>
              </div>

              <div className={styles.confidenceBar}>
                <div className={styles.confidenceHeader}>
                  <span>Confiança nos dados da viagem</span>
                  <span>{Math.round((intent?.confidence?.overall || 0.85) * 100)}%</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${Math.round((intent?.confidence?.overall || 0.85) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className={styles.actionsRow}>
              <button className={styles.secondaryBtn} onClick={() => setStep(2)}>
                Ajustar Escolhas
              </button>
              <button className={styles.primaryBtn} onClick={handleGenerate}>
                <Sparkles size={16} />
                <span>Gerar Roteiro Personalizado</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Generation Loading State */}
        {step === 4 && (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <h2 className={styles.loadingTitle}>A criar o teu roteiro para {intent?.destination}...</h2>
            <p className={styles.loadingSub}>
              A selecionar atividades verificadas, otimizar deslocações e ajustar ao teu ritmo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
