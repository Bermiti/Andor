'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/my-trips');
  }, [router]);

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
        Redirecting to Explorer Hub...
      </div>
    </div>
  );
}
