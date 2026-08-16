'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  HelpCircle,
} from 'lucide-react';
import { parseNaturalLanguageIntent, buildConfirmationChips } from '../lib/natural-intent-parser';
import { getTravelPersona, updateTravelPersona } from '../lib/travel-persona';
import {
  buildGenerationPayloadFromIntent,
  createGenerationIntentKey,
  fingerprintGenerationPayload,
  resolveGeneratedItineraryResponse,
} from '../lib/generation-client';
import styles from './CreationExperience.module.css';

export default function CreationExperience({
  isOpen,
  onClose,
  initialText = '',
  initialDestination = '',
  onItineraryCreated,
}) {
  const router = useRouter();
  const [inputText, setInputText] = useState(initialText);
  const [intent, setIntent] = useState(null);
  const [step, setStep] = useState(1); // 1: Input & Chips, 2: Dynamic Adaptive Questions, 3: True Preview, 4: Generating
  const [editingChip, setEditingChip] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adaptiveAnswers, setAdaptiveAnswers] = useState({});
  const generationIntentRef = useRef(null);

  // Initialize intent from initial input
  useEffect(() => {
    if (isOpen) {
      const textToParse = initialText || (initialDestination ? `Viagem para ${initialDestination}` : '');
      setInputText(textToParse);
      const parsed = parseNaturalLanguageIntent(textToParse);
      if (initialDestination && parsed.fields.destinations.length === 0) {
        parsed.fields.destinations = [{ raw: initialDestination, canonical: initialDestination, type: 'city' }];
        parsed.missingFields = parsed.missingFields.filter((f) => f !== 'destinations');
      }
      setIntent(parsed);
      setStep(1);
      setErrorMsg('');
      setIsSubmitting(false);
      setAdaptiveAnswers({});
      generationIntentRef.current = null;
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

  const updateField = (fieldName, val) => {
    setIntent((prev) => {
      const nextFields = { ...prev.fields, [fieldName]: val };
      const nextMissing = prev.missingFields.filter((f) => f !== fieldName);
      return {
        ...prev,
        fields: nextFields,
        missingFields: nextMissing,
      };
    });
    setEditingChip(null);
  };

  // Determine dynamic questions needed based on intent state
  const getDynamicQuestions = () => {
    if (!intent || !intent.fields) return [];

    const questions = [];
    const f = intent.fields;

    // 1. Missing Destination Question
    if (f.destinations.length === 0) {
      questions.push({
        id: 'missing_destination',
        title: 'Para onde gostarias de viajar?',
        desc: 'Escolhe um estilo de destino para sugerirmos as melhores opções.',
        options: [
          { id: 'dest_europe_classic', label: 'Europa Clássica (Roma, Paris, Lisboa)', value: 'Roma, Itália' },
          { id: 'dest_nature_islands', label: 'Natureza & Ilhas (Açores, Escócia)', value: 'Açores, Portugal' },
          { id: 'dest_asia_exotic', label: 'Exótico & Ásia (Tóquio, Bali)', value: 'Tóquio, Japão' },
        ],
        onSelect: (opt) => {
          updateField('destinations', [{ raw: opt.value, canonical: opt.value, type: 'city' }]);
        },
      });
    }

    // 2. Budget Conflict Question (if detected)
    if (intent.conflicts.some((c) => c.field === 'budget')) {
      questions.push({
        id: 'conflict_budget',
        title: 'Clarificação sobre o Orçamento',
        desc: 'Foram detetados sinais de luxo e economia. Qual é a tua prioridade real?',
        options: [
          { id: 'budget_eco', label: 'Prioridade a Poupança (Económico)', value: { tier: 'economic', label: 'Económico' } },
          { id: 'budget_mod', label: 'Equilíbrio Qualidade-Preço', value: { tier: 'moderate', label: 'Equilibrado' } },
          { id: 'budget_lux', label: 'Prioridade a Luxo e Conforto', value: { tier: 'luxury', label: 'Luxo' } },
        ],
        onSelect: (opt) => updateField('budget', opt.value),
      });
    }

    // 3. Multi-destination or Long Duration Split Question
    if (f.destinations.length > 1 || (f.durationDays && f.durationDays >= 7)) {
      questions.push({
        id: 'accommodation_split',
        title: 'Estadia & Deslocação',
        desc: `Com ${f.durationDays || 7} dias, preferes fixar base numa só cidade ou dividir estadias?`,
        options: [
          { id: 'single_base', label: 'Fixar base num único alojamento' },
          { id: 'split_stages', label: 'Dividir noites entre várias cidades' },
        ],
        onSelect: (opt) => setAdaptiveAnswers((prev) => ({ ...prev, accommodationSplit: opt.id })),
      });
    }

    // 4. Missing Pace Question (only if pace is not set)
    if (!f.pace) {
      questions.push({
        id: 'pace_selection',
        title: 'Ritmo da Viagem',
        desc: 'Como preferes distribuir o tempo durante os dias?',
        options: [
          { id: 'relaxed', label: 'Tranquilo & Calmo (Mais tempo livre)' },
          { id: 'balanced', label: 'Equilibrado (Ritmo ideal)' },
          { id: 'fast', label: 'Intenso (Ver tudo o que for possível)' },
        ],
        onSelect: (opt) => updateField('pace', { pace: opt.id, label: opt.label }),
      });
    }

    return questions;
  };

  const dynamicQuestions = getDynamicQuestions();

  const handleProceedFromStep1 = () => {
    if (!intent?.fields?.destinations || intent.fields.destinations.length === 0) {
      setErrorMsg('Indica o destino da viagem para continuar.');
      return;
    }
    setErrorMsg('');
    if (dynamicQuestions.length > 0) {
      setStep(2);
    } else {
      setStep(3); // Skip straight to preview if all info is clear!
    }
  };

  const handleProceedToPreview = () => {
    setStep(3);
  };

  const handleGenerate = async () => {
    if (isSubmitting) return; // Duplicate submission safety
    setIsSubmitting(true);
    setStep(4);
    setErrorMsg('');

    try {
      const f = intent.fields;

      // Update persona locally & transparently
      updateTravelPersona({
        pace: f.pace?.pace || 'balanced',
        budgetTier: f.budget?.tier || 'moderate',
        interests: (f.interests || []).map((i) => i.id),
      });

      const body = buildGenerationPayloadFromIntent(intent, adaptiveAnswers);
      const fingerprint = await fingerprintGenerationPayload(body);
      const generationIntent = generationIntentRef.current?.fingerprint === fingerprint
        ? generationIntentRef.current
        : { key: createGenerationIntentKey(), fingerprint };
      generationIntentRef.current = generationIntent;

      const res = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': generationIntent.key,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error?.message || data?.message || 'Erro na geração da viagem.');
      }

      const result = resolveGeneratedItineraryResponse(data);
      let tripId = result.id;
      if (result.mode === 'local_draft') {
        const { saveGeneratedItinerary } = await import('../lib/itinerary-store');
        tripId = saveGeneratedItinerary(result.itinerary);
      }
      if (!tripId) {
        throw new Error('Identificador da viagem não devolvido.');
      }
      if (onItineraryCreated) onItineraryCreated({ ...data, id: tripId });
      router.push(`/itinerary/${tripId}`);
    } catch (err) {
      console.error('Generation failure:', err);
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Erro de comunicação ao criar o roteiro. Tenta novamente.');
      setStep(3);
    }
  };

  const chips = buildConfirmationChips(intent);
  const f = intent?.fields || {};

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Criar viagem personalizada"
        onClick={(e) => e.stopPropagation()}
      >
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

        {/* Step 1: Natural Text & Structured Chips */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <h2 className={styles.title}>Descreve a viagem que imaginas</h2>
            <p className={styles.subtitle}>
              Escreve em linguagem natural. A Andor extrai os dados e pede apenas o que faltar.
            </p>

            <div className={styles.inputWrapper}>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="Ex: Quero passar cinco dias em Roma em setembro com a minha namorada..."
                value={inputText}
                onChange={handleTextChange}
                autoFocus
              />
            </div>

            {/* Extracted Chips Section */}
            <div className={styles.chipsSection}>
              <div className={styles.chipsTitle}>Dados extraídos da intenção:</div>
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

              {/* Inline Chip Contextual Editors */}
              {editingChip === 'destinations' && (
                <div className={styles.quickEditor}>
                  <label>Destino:</label>
                  <input
                    type="text"
                    value={f.destinations[0]?.canonical || ''}
                    onChange={(e) =>
                      updateField('destinations', [{ raw: e.target.value, canonical: e.target.value, type: 'city' }])
                    }
                    placeholder="Ex: Roma, Itália"
                  />
                </div>
              )}

              {editingChip === 'durationDays' && (
                <div className={styles.quickEditor}>
                  <label>Duração (dias):</label>
                  <div className={styles.numSelector}>
                    {[3, 4, 5, 7, 10, 14].map((d) => (
                      <button
                        key={d}
                        className={f.durationDays === d ? styles.numActive : ''}
                        onClick={() => updateField('durationDays', d)}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.actionsRow}>
              <button className={styles.primaryBtn} onClick={handleProceedFromStep1}>
                <span>{dynamicQuestions.length > 0 ? 'Continuar e Ajustar Lacunas' : 'Ver Resumo da Viagem'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Dynamic Adaptive Questions */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <h2 className={styles.title}>Perguntas Adaptativas</h2>
            <p className={styles.subtitle}>Apenas as decisões necessárias para esclarecer a tua viagem.</p>

            <div className={styles.questionsContainer}>
              {dynamicQuestions.map((q) => (
                <div key={q.id} className={styles.choiceGroup}>
                  <div className={styles.groupLabel}>{q.title}</div>
                  <div className={styles.groupSub}>{q.desc}</div>
                  <div className={styles.cardsGrid}>
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`${styles.selectCard} ${adaptiveAnswers[q.id] === opt.id ? styles.selectedCard : ''}`}
                        onClick={() => {
                          setAdaptiveAnswers((prev) => ({ ...prev, [q.id]: opt.id }));
                          if (q.onSelect) q.onSelect(opt);
                        }}
                      >
                        <div className={styles.cardHeader}>
                          <span className={styles.cardTitle}>{opt.label}</span>
                          {adaptiveAnswers[q.id] === opt.id && <Check size={16} className={styles.checkIcon} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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

        {/* Step 3: True Preview (No invented specific activities) */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <h2 className={styles.title}>Resumo do Roteiro</h2>
            <p className={styles.subtitle}>Verifica a estrutura antes da geração real pela IA.</p>

            <div className={styles.previewBox}>
              <div className={styles.previewHeader}>
                <MapPin size={18} className={styles.previewIcon} />
                <span className={styles.previewDest}>
                  {f.destinations.map((d) => d.canonical).join(' + ') || 'Destino a escolher'}
                </span>
                <span className={styles.previewDays}>{f.durationDays || 5} Dias</span>
              </div>

              <div className={styles.previewGrid}>
                <div className={styles.previewItem}>
                  <span className={styles.itemLabel}>Viajantes</span>
                  <span className={styles.itemVal}>{f.travelers?.label || 'Casal'}</span>
                </div>
                <div className={styles.previewItem}>
                  <span className={styles.itemLabel}>Orçamento</span>
                  <span className={styles.itemVal}>{f.budget?.label || 'Equilibrado'}</span>
                </div>
                <div className={styles.previewItem}>
                  <span className={styles.itemLabel}>Ritmo</span>
                  <span className={styles.itemVal}>{f.pace?.label || 'Equilibrado'}</span>
                </div>
                <div className={styles.previewItem}>
                  <span className={styles.itemLabel}>Interesses</span>
                  <span className={styles.itemVal}>
                    {f.interests?.length > 0 ? f.interests.map((i) => i.label).join(', ') : 'Gerais'}
                  </span>
                </div>
              </div>

              <div className={styles.confidenceBar}>
                <div className={styles.confidenceHeader}>
                  <span>Confiança na estrutura da viagem</span>
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
              <button className={styles.secondaryBtn} onClick={() => setStep(dynamicQuestions.length > 0 ? 2 : 1)}>
                Ajustar
              </button>
              <button className={styles.primaryBtn} onClick={handleGenerate} disabled={isSubmitting}>
                <Sparkles size={16} />
                <span>{isSubmitting ? 'A Gerar...' : 'Gerar Roteiro Personalizado'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Loading State */}
        {step === 4 && (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <h2 className={styles.loadingTitle}>A criar o teu roteiro para {f.destinations[0]?.canonical}...</h2>
            <p className={styles.loadingSub}>
              A selecionar atividades verificadas, otimizar deslocações e ajustar ao teu ritmo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
