'use client';

import React from 'react';

export function ElegantErrorCard({ error, resetErrorBoundary }) {
  return (
    <div style={{
      padding: '24px',
      background: 'rgba(239, 68, 68, 0.05)',
      border: '1px dashed rgba(239, 68, 68, 0.3)',
      borderRadius: '16px',
      color: '#fff',
      textAlign: 'center',
      maxWidth: '480px',
      margin: '20px auto',
      fontFamily: 'var(--font-body), sans-serif'
    }}>
      <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>🧭</span>
      <h3 style={{
        fontFamily: 'var(--font-heading), serif',
        fontSize: '1.25rem',
        margin: '0 0 8px 0',
        color: '#f87171'
      }}>
        Erro ao carregar componente
      </h3>
      <p style={{
        fontSize: '0.9rem',
        color: 'var(--text-secondary, #A8B3C8)',
        lineHeight: '1.5',
        margin: '0 0 16px 0'
      }}>
        Algo correu mal nesta secção, mas podes continuar a explorar e planear a tua viagem sem problemas.
      </p>
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          style={{
            padding: '8px 18px',
            background: 'var(--gold, #D4A843)',
            color: '#050b14',
            border: 'none',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error if needed
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ElegantErrorCard error={this.state.error} resetErrorBoundary={this.resetError} />;
    }

    return this.props.children;
  }
}
