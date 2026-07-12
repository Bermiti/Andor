import Link from 'next/link';
import AndorLogo from '../../../components/AndorLogo';
import SharedItineraryView from '../../../components/SharedItineraryView';
import { getRequestIdentity } from '../../../lib/server/identity';
import { getItineraryShare } from '../../../lib/server/share-dal';
import styles from './share-page.module.css';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const statusCopy = {
  expired: ['Partilha expirada', 'Pede a quem preparou a viagem um novo link com uma validade atualizada.'],
  revoked: ['Partilha revogada', 'Este acesso foi encerrado pela pessoa que gere o itinerario.'],
  forbidden: ['Acesso reservado', 'Este dossier interno so esta disponivel na sessao da equipa proprietaria.'],
  not_found: ['Partilha indisponivel', 'O link pode estar incompleto ou ja nao existir.'],
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
  const identity = await getRequestIdentity();
  const result = await getItineraryShare(uuid, identity);
  if (!result.ok) return <ShareStatus status={result.status} />;
  return <SharedItineraryView itinerary={result.payload} share={result.share} />;
}
