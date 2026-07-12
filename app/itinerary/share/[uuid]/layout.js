export const metadata = {
  title: 'Itinerário Partilhado · Andor',
  description: 'Vê este itinerário de viagem incrível gerado por inteligência artificial no Andor.',
  referrer: 'no-referrer',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  openGraph: {
    title: 'Itinerário Partilhado · Andor',
    description: 'Vê este itinerário de viagem incrível gerado por inteligência artificial no Andor.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Itinerário Andor',
      }
    ]
  }
};

export default function ShareLayout({ children }) {
  return <>{children}</>;
}
