import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import ItineraryGenerator from './components/ItineraryGenerator';
import MapPreview from './components/MapPreview';
import QuickPlan from './components/QuickPlan';
import AiAssistant from './components/AiAssistant';
import Social from './components/Social';
import Pricing from './components/Pricing';
import Footer from './components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <ItineraryGenerator />
        <MapPreview />
        <QuickPlan />
        <AiAssistant />
        <Social />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
