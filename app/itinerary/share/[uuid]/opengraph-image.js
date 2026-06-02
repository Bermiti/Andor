import { ImageResponse } from 'next/og';

export const alt = 'Andor Travels — Itinerário Partilhado';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0A1628 0%, #050B14 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: '80px',
          border: '12px solid #D4A843',
        }}
      >
        {/* Logo / Brand Mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '120px',
            height: '120px',
            borderRadius: '24px',
            background: '#D4A843',
            marginBottom: '40px',
          }}
        >
          <span style={{ fontSize: '70px', color: '#ffffff' }}>✈</span>
        </div>

        {/* Brand Name */}
        <div
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            letterSpacing: '4px',
            color: '#D4A843',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          Andor Travels
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '54px',
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: '24px',
            lineHeight: 1.2,
          }}
        >
          Itinerário de Viagem Personalizado
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '24px',
            color: '#A0AEC0',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          Descobre um plano detalhado com hotéis, voos e atividades sugeridos pelo nosso concierge de inteligência artificial.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
