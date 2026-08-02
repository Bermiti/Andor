import Link from 'next/link';
import AndorLogo from '../../../components/AndorLogo';
import SharedItineraryView from '../../../components/SharedItineraryView';
import { getItineraryShare } from '../../../lib/server/share-dal';
import styles from './share-page.module.css';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

const statusCopy = {
  not_found: ['Partilha indisponivel', 'O link pode estar incompleto ou ja nao existir.'],
  unavailable: ['Partilha temporariamente indisponivel', 'Tenta novamente dentro de alguns minutos.'],
};

function ShareStatus({ status }) {
  const [title, detail] = statusCopy[status] || statusCopy.not_found;
  return (
    <main className={styles.statusPage}>
      <div className={styles.statusBrand}>
        <AndorLogo size={46} />
        <span><strong>ANDOR</strong><small>TRAVELS</small></span>
      </div>
      <div className={styles.statusRule} />
      <span className={styles.statusCode}>Ligacao segura</span>
      <h1>{title}</h1>
      <p>{detail}</p>
      <Link href="/">Voltar a Andor Travels</Link>
    </main>
  );
}

export default async function SharedItineraryPage({ params }) {
  const { uuid } = await params;
  const result = await getItineraryShare(uuid);
  if (!result.ok) {
    const status = ['persistence_unavailable', 'storage_error'].includes(result.status)
      ? 'unavailable'
      : 'not_found';
    return <ShareStatus status={status} />;
  }
  return <SharedItineraryView itinerary={result.payload} share={result.share} />;
}
