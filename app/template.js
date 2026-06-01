'use client';
import { useEffect, useState } from 'react';

export default function Template({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={{
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      {children}
    </div>
  );
}
