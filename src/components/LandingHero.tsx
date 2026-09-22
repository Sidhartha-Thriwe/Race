import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface LandingHeroProps {
  onOpenContact: () => void;
  onGetStarted: () => void;
}

export default function LandingHero({ onOpenContact, onGetStarted }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden pt-16 lg:pt-24 px-6 sm:px-12 text-center pb-16 lg:pb-24">
      {/* Background Floating Gradient Glow */}
      <div className="absolute top-[-340px] left-1/2 -translate-x-1/2 w-[1150px] height-[1000px] aspect-square rounded-full bg-radial from-[#5d8ae8]/30 via-[#8baeef]/10 to-transparent animate-floatglow pointer-events-none z-0" />

      {/* Hero Text content */}
      <div className="relative max-w-4xl mx-auto z-10">
        {/* Monospace spaced eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-mono text-[11px] font-medium tracking-[0.34em] uppercase text-neutral-400 mb-6"
        >
          Customer Intelligence
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-[74px] font-medium tracking-[-0.035em] text-neutral-900 leading-[1.02] max-w-5xl mx-auto balance"
        >
          Find them. Understand<br className="hidden sm:inline" /> them. Keep them.
        </motion.h1>

        {/* Subtitle description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-base md:text-[19px] text-neutral-500 max-w-2xl mx-auto mt-6 leading-[1.55]"
        >
          India's most precise customer intelligence ecosystem, built to turn insight into the customer decisions that matter.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-9"
        >
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-[#0b0c0e] hover:bg-neutral-800 text-white rounded-full text-sm font-semibold cursor-pointer transition-all shadow-lg shadow-[#0b0c0e]/15 hover:translate-y-[-1px] active:translate-y-[0px] flex items-center gap-2 group"
          >
            <span>Get Started</span>
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={onOpenContact}
            className="px-8 py-4 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200/80 hover:border-neutral-300 rounded-full text-sm font-semibold cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
          >
            Talk to us
          </button>
        </motion.div>
      </div>

      {/* Static Dashboard Mock Window Container */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="relative max-w-[1360px] mx-auto mt-16"
      >
        <div className="rounded-[26px] border border-neutral-200/60 bg-gradient-to-b from-[#f7f9fe] to-[#eef3fd] p-3 shadow-2xl">
          <div className="relative rounded-[18px] overflow-hidden bg-white shadow-inner aspect-[16/9] flex items-center justify-center">
            <img 
              src="/hero-dashboard.png" 
              alt="RACE Customer Intelligence Dashboard" 
              className="w-full h-full object-cover object-top"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
