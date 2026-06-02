'use client';
import dynamic from 'next/dynamic';

const FloatingAi = dynamic(() => import('./FloatingAi'), {
  ssr: false,
  loading: () => null,
});

export default function FloatingAiWrapper() {
  return <FloatingAi />;
}
