'use client';

import { usePathname } from 'next/navigation';
import CommandCenter from './CommandCenter';
import CustomRequestModal from './CustomRequestModal';
import EasterEgg from './EasterEgg';
import FloatingAiWrapper from './FloatingAiWrapper';
import NewsletterPopup from './NewsletterPopup';
import SplashScreen from './SplashScreen';

export default function GlobalOverlays() {
  const pathname = usePathname();
  if (pathname?.startsWith('/itinerary/share/')) return null;

  return (
    <>
      <SplashScreen />
      <EasterEgg />
      <CommandCenter />
      <FloatingAiWrapper />
      <CustomRequestModal />
      <NewsletterPopup />
    </>
  );
}
