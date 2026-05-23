'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShareRedirect({ params }) {
  const router = useRouter();

  useEffect(() => {
    if (params?.uuid) {
      router.replace(`/itinerary/${params.uuid}`);
    } else {
      router.replace('/');
    }
  }, [params, router]);

  return <div style={{ padding: '40px', textAlign: 'center' }}>Loading shared itinerary...</div>;
}
