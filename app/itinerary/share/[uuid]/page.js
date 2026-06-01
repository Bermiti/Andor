'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ShareRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const uuid = Array.isArray(params?.uuid) ? params.uuid[0] : params?.uuid;
    if (uuid) {
      router.replace(`/itinerary/${uuid}`);
    } else {
      router.replace('/');
    }
  }, [params, router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-0)',
      color: 'var(--t-0)',
      fontFamily: 'var(--font-outfit)'
    }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 'var(--space-4)' }} />
      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 500 }}>A abrir o teu itinerário...</h2>
      <p style={{ color: 'var(--t-1)', marginTop: 'var(--space-2)' }}>Andor Travels</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
