import Link from 'next/link';
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  MapPin,
  PlaneTakeoff,
  ShieldCheck,
} from 'lucide-react';
import AndorLogo from './AndorLogo';
import { destinationLabel, getDestinationCover } from '../lib/destination-media';
import styles from './SharedItineraryView.module.css';

function formatDate(value, options = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('pt-PT', options).format(date);
}

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function statusLabel(status) {
  const labels = {
    confirmed: 'Confirmado',
    booked: 'Reservado',
    ready: 'Pronto',
    uploaded_confirmed: 'Validado',
    selected: 'Selecionado',
    searching: 'Em pesquisa',
    needed: 'Necessario',
    not_started: 'Por iniciar',
  };
  return labels[status] || status || 'Por iniciar';
}

export default function SharedItineraryView({ itinerary, share }) {
  const mode = share?.audience === 'internal' ? 'internal' : 'client';
  const destination = destinationLabel(itinerary?.destination);
  const trip = itinerary?.trip || {};
  const days = asArray(itinerary?.days);
  const metadata = itinerary?.exportMetadata || {};
  const booking = asArray(itinerary?.bookingChecklist);
  const documents = asArray(itinerary?.documentsChecklist);
  const backups = asArray(itinerary?.backupPlans);
  const cover = getDestinationCover(itinerary?.destination);
  const totalDays = trip.totalDays || days.length;
  const travelers = trip.travelers || trip.numberOfTravelers || metadata.travelers;
  const travelerLabel = Number(travelers) === 1 ? 'viajante' : 'viajantes';
  const dateRange = [formatDate(trip.startDate), formatDate(trip.endDate)].filter(Boolean).join(' - ');

  return (
    <main className={styles.page}>
      <header className={styles.hero} style={{ backgroundImage: `url(${cover})` }}>
        <div className={styles.heroShade} />
        <nav className={styles.brandBar} aria-label="Andor Travels">
          <Link href="/" className={styles.brand}>
            <span className={styles.logoPlate}><AndorLogo size={36} /></span>
            <span><strong>ANDOR</strong><small>TRAVELS</small></span>
          </Link>
          <span className={styles.accessPill}>
            {mode === 'internal' ? <LockKeyhole size={15} /> : <ShieldCheck size={15} />}
            {mode === 'internal' ? 'Dossier interno' : 'Versao cliente'}
          </span>
        </nav>

        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Itinerario personalizado</span>
          <h1>{destination}</h1>
          <p>{trip.summary || trip.tripOverview || 'Uma viagem organizada ao detalhe pela Andor Travels.'}</p>
          <div className={styles.heroFacts}>
            <span><CalendarDays size={18} /> {totalDays || 'Varios'} dias</span>
            {travelers && <span><PlaneTakeoff size={18} /> {travelers} {travelerLabel}</span>}
            {trip.travelStyle && <span><MapPin size={18} /> {trip.travelStyle}</span>}
          </div>
        </div>
      </header>

      <section className={styles.documentBand} aria-label="Detalhes do documento">
        <div className={styles.documentGrid}>
          <div><span>Preparado para</span><strong>{metadata.companyName || metadata.clientName || 'Viajante Andor'}</strong></div>
          <div><span>Datas</span><strong>{dateRange || 'A confirmar'}</strong></div>
          <div><span>Valido ate</span><strong>{formatDate(share?.expiresAt)}</strong></div>
          <div><span>Referencia</span><strong>{String(share?.id || '').slice(0, 8).toUpperCase()}</strong></div>
        </div>
      </section>

      {(metadata.clientFacingNotes || (mode === 'internal' && metadata.internalNotes)) && (
        <section className={styles.notesBand}>
          <div className={styles.sectionInner}>
            <span className={styles.sectionKicker}>{mode === 'internal' ? 'Briefing operacional' : 'Nota da Andor'}</span>
            <h2>{mode === 'internal' ? 'Contexto da viagem' : 'Antes de partir'}</h2>
            {metadata.clientFacingNotes && <p>{metadata.clientFacingNotes}</p>}
            {mode === 'internal' && metadata.internalNotes && (
              <div className={styles.internalNote}>
                <BriefcaseBusiness size={18} />
                <div><strong>Nota interna</strong><p>{metadata.internalNotes}</p></div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className={styles.itinerarySection}>
        <div className={styles.sectionInner}>
          <span className={styles.sectionKicker}>Programa</span>
          <h2>O itinerario, dia a dia</h2>
          <div className={styles.days}>
            {days.map((day, dayIndex) => (
              <article className={styles.day} key={day.id || day.dayNumber || dayIndex}>
                <header className={styles.dayHeader}>
                  <div className={styles.dayNumber}>{String(day.dayNumber || dayIndex + 1).padStart(2, '0')}</div>
                  <div>
                    <span>{day.date ? formatDate(day.date, { weekday: 'long', day: '2-digit', month: 'long' }) : `Dia ${dayIndex + 1}`}</span>
                    <h3>{day.title || `Descobrir ${destination}`}</h3>
                  </div>
                </header>
                <div className={styles.stops}>
                  {asArray(day.stops).map((stop, stopIndex) => (
                    <div className={styles.stop} key={stop.id || `${stop.name}-${stopIndex}`}>
                      <div className={styles.stopTime}><Clock3 size={14} /> {stop.time || 'Flexivel'}</div>
                      <div>
                        <h4>{stop.name || stop.title || 'Experiencia Andor'}</h4>
                        <p>{stop.description || stop.type || stop.notes || 'Paragem selecionada para este dia.'}</p>
                        {(stop.estimatedCost || stop.duration) && (
                          <small>{[stop.duration, stop.estimatedCost].filter(Boolean).join(' | ')}</small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {(booking.length > 0 || documents.length > 0 || backups.length > 0) && (
        <section className={styles.readinessBand}>
          <div className={styles.sectionInner}>
            <span className={styles.sectionKicker}>Preparacao</span>
            <h2>Reservas, documentos e alternativas</h2>
            <div className={styles.readinessGrid}>
              {booking.length > 0 && (
                <div className={styles.readinessColumn}>
                  <h3>Reservas</h3>
                  {booking.slice(0, 8).map((item, index) => (
                    <div className={styles.checkRow} key={item.id || index}>
                      <CheckCircle2 size={16} />
                      <span><strong>{item.task || item.title}</strong><small>{statusLabel(item.status)}</small></span>
                    </div>
                  ))}
                </div>
              )}
              {documents.length > 0 && (
                <div className={styles.readinessColumn}>
                  <h3>Documentos</h3>
                  {documents.slice(0, 8).map((item, index) => (
                    <div className={styles.checkRow} key={item.id || index}>
                      <CheckCircle2 size={16} />
                      <span><strong>{item.title || item.label}</strong><small>{statusLabel(item.status)}</small></span>
                    </div>
                  ))}
                </div>
              )}
              {backups.length > 0 && (
                <div className={styles.readinessColumn}>
                  <h3>Planos alternativos</h3>
                  {backups.slice(0, 6).map((item, index) => (
                    <div className={styles.checkRow} key={item.id || index}>
                      <ShieldCheck size={16} />
                      <span><strong>{item.trigger || item.title || 'Alternativa'}</strong><small>{item.clientFacing || item.replacementPlan}</small></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <div className={styles.footerBrand}><AndorLogo size={32} /><span><strong>ANDOR TRAVELS</strong><small>Planeamento e curadoria de viagens</small></span></div>
        <p>Documento de leitura. Horarios, disponibilidade e precos devem ser confirmados antes da reserva.</p>
        <Link href="/">Abrir Andor Travels</Link>
      </footer>
    </main>
  );
}
