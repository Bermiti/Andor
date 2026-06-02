'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Unhandled app error:', error);
    }
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-0)',
      color: 'var(--t-0)',
      fontFamily: 'var(--font-outfit)',
      padding: 'var(--space-6)',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: 'var(--space-4)', fontSize: '3rem' }}>🚨</div>
      <h2 style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>Ups! Algo correu mal.</h2>
      <p style={{ color: 'var(--t-1)', marginBottom: 'var(--space-5)', maxWidth: '500px' }}>
        Encontrámos um erro inesperado. A nossa equipa de exploração já foi notificada.
      </p>
      
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          style={{
            backgroundColor: 'var(--t-0)',
            color: 'var(--bg-0)',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Tentar novamente
        </button>
        <Link href="/" style={{
          backgroundColor: 'transparent',
          color: 'var(--t-0)',
          border: '1px solid var(--b-1)',
          padding: '12px 24px',
          borderRadius: 'var(--radius-md)',
          fontWeight: 500,
          textDecoration: 'none'
        }}>
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
