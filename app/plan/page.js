'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreationWizard from '../components/CreationWizard';

export default function PlanPage() {
  const router = useRouter();
  const [destination, setDestination] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDestination(params.get('dest') || '');
  }, []);

  return (
    <CreationWizard
      key={destination || 'new-trip'}
      isOpen={true}
      onClose={() => router.push('/')}
      initialDestination={destination}
      initialStep={1}
    />
  );
}
