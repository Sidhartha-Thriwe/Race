import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import ProblemSection from './components/ProblemSection';
import RaceMethod from './components/RaceMethod';
import FourEngines from './components/FourEngines';
import UseCases from './components/UseCases';
import SecurityCompliance from './components/SecurityCompliance';
import ImpactSection from './components/ImpactSection';
import PartnerMarquee from './components/PartnerMarquee';
import TalkToUsModal from './components/TalkToUsModal';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [view, setView] = useState<'landing' | 'admin'>('landing');

  const handleLogout = () => {
    setView('landing');
    window.scrollTo({ top: 0 });
  };

  const handleGetStarted = () => {
    setView('admin');
    window.scrollTo({ top: 0 });
  };

  if (view === 'admin') {
    return <AdminPanel onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-[#fff] text-neutral-800 flex flex-col font-sans antialiased overflow-x-hidden selection:bg-[#5d8ae8]/10 selection:text-[#5d8ae8]">
      {/* Sticky Navbar */}
      <Navbar onOpenContact={() => setIsContactOpen(true)} />

      <main className="flex-1 flex flex-col">
        {/* Hero Banner Section */}
        <LandingHero onOpenContact={() => setIsContactOpen(true)} onGetStarted={handleGetStarted} />

        {/* Problem Statements Cards Section */}
        <ProblemSection />

        {/* Steps Timeline section of the RACE Method */}
        <RaceMethod />

        {/* Clickable tabs for the four systems / engines */}
        <FourEngines />

        {/* Use cases Grid */}
        <UseCases />

        {/* Data security / ISO details */}
        <SecurityCompliance />

        {/* Speed & Consistent outcomes benefits */}
        <ImpactSection />

        {/* Trusted partner horizontal marquee */}
        <PartnerMarquee />

        {/* Bottom Call to Action banner */}
        <section id="contact" className="relative overflow-hidden bg-[#0b0c0e] text-white py-24 lg:py-32 px-6 sm:px-12 text-center scroll-mt-20">
          {/* Radial glow background */}
          <div className="absolute bottom-[-420px] left-1/2 -translate-x-1/2 w-[1100px] height-[900px] aspect-square rounded-full bg-radial from-[#5d8ae8]/45 via-[#4062be]/10 to-transparent animate-floatglow-slow pointer-events-none z-0" />

          <div className="relative max-w-3xl mx-auto z-10 space-y-6">
            <h2 className="text-4xl md:text-[52px] font-medium tracking-[-0.035em] leading-[1.05] balance">
              Ready to stop guessing about your customers?
            </h2>
            <p className="text-neutral-400 text-base md:text-[17.5px] max-w-lg mx-auto leading-[1.55]">
              Talk to our team about what RACE could unlock for your business.
            </p>
            <button
              onClick={() => setIsContactOpen(true)}
              className="px-8 py-4 bg-white text-[#0b0c0e] hover:bg-neutral-50 rounded-full text-sm font-semibold transition-all shadow-xl hover:translate-y-[-1px] active:translate-y-[0px] cursor-pointer inline-flex items-center gap-2"
            >
              <span>Talk to us</span>
              <ArrowUpRight size={15} />
            </button>
          </div>
        </section>
      </main>

      {/* Footer Metadata */}
      <footer className="bg-[#0b0c0e] text-neutral-500 py-6 border-t border-white/5 relative z-10">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span>© 2026 Thriwe. RACE is a Thriwe product.</span>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsContactOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => setIsContactOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Terms & Conditions
            </button>
            <button 
              onClick={() => setIsContactOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Contact
            </button>
          </div>
        </div>
      </footer>

      {/* Universal Contact/Form Modal */}
      <TalkToUsModal 
        isOpen={isContactOpen} 
        onClose={() => setIsContactOpen(false)} 
      />
    </div>
  );
}
