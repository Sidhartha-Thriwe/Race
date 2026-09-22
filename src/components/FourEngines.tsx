import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Star, RefreshCw, Zap } from 'lucide-react';

interface EngineData {
  num: string;
  key: string;
  tag: string;
  head: string;
  img: string;
  body: string;
}

export default function FourEngines() {
  const [activeIdx, setActiveIdx] = useState(0);

  const engines: EngineData[] = [
    {
      num: '01',
      key: 'Segmentation Engine',
      tag: 'Know who matters.',
      head: 'Know who matters, and who they really are.',
      img: '/segmentation.png',
      body: "At 99% accuracy, the Segmentation Engine matches a client's user base against segments built from 10 Lakh+ Thriwe B2C customer touchpoints worldwide. Each segment is tuned specifically for affluent, HNI, and UHNI spending patterns, not adapted from a generic model."
    },
    {
      num: '02',
      key: 'Matching Engine',
      tag: 'Find what fits.',
      head: 'Find what fits, in real time.',
      img: '/matching.png',
      body: 'The Matching Engine connects the right customers with the right benefits, in real time, using intent and affinity matching across 100+ real-world variables, including seasonality, purchase cycles, and macroeconomic shifts.'
    },
    {
      num: '03',
      key: 'Retention Engine',
      tag: 'Turn insight into action.',
      head: 'Turn insight into action, one relationship at a time.',
      img: '/retention.png',
      body: 'The Retention Engine predicts churn, identifies at-risk customers, and triggers personalized interventions, so every retention effort is built around what a specific relationship actually values, replacing a blanket discount with the one reason that fits that customer alone.'
    },
    {
      num: '04',
      key: 'Engagement Engine',
      tag: 'Keep the relationship alive.',
      head: 'Keep the relationship alive, at the right time.',
      img: '/engagement.png',
      body: 'The Engagement Engine delivers personalized experiences across channels, so every insight closes with a specific next step, the right merchant, offer, or channel, and understanding a customer becomes something a business can act on.'
    }
  ];

  const activeEngine = engines[activeIdx];

  const tabIcons = [
    { icon: Users, color: '#2c56b4' },
    { icon: Star, color: '#2c56b4' },
    { icon: RefreshCw, color: '#2c56b4' },
    { icon: Zap, color: '#2c56b4' },
  ];

  return (
    <section id="engines" className="py-24 lg:py-32 px-6 sm:px-12 max-w-[1440px] mx-auto border-t border-neutral-100 scroll-mt-20">
      <div>
        {/* Monospace eyebrow */}
        <div className="font-mono text-[11px] font-medium tracking-[0.34em] uppercase text-neutral-400 text-center">
          The Architecture
        </div>
        {/* Title */}
        <h2 className="text-3xl md:text-[52px] font-medium tracking-[-0.032em] text-neutral-900 leading-[1.04] text-center mt-4">
          The Four Engines
        </h2>
        {/* Subtitle */}
        <p className="text-sm md:text-[17.5px] text-neutral-500 max-w-2xl mx-auto text-center mt-4 leading-[1.6]">
          One pipeline, four systems: know who matters, find what fits, act on it, and keep the relationship going.
        </p>

        {/* 4 Clickable Tab Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-14">
          {engines.map((eng, idx) => {
            const isActive = activeIdx === idx;
            const TabIcon = tabIcons[idx].icon;

            return (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`text-left cursor-pointer rounded-[20px] p-6 transition-all border outline-none ${
                  isActive
                    ? 'bg-[#0b0c0e] border-[#0b0c0e] text-white translate-y-[-3px] shadow-xl shadow-[#0b0c0e]/15'
                    : 'bg-white border-neutral-200/60 text-neutral-800 hover:border-neutral-300 shadow-sm'
                }`}
              >
                {/* Icon wrapper */}
                <div className={`w-9 h-9 rounded-xl mb-6 flex items-center justify-center transition-colors ${
                  isActive ? 'bg-white/15 text-white' : 'bg-[#eaf0fd] text-[#2c56b4]'
                }`}>
                  <TabIcon size={18} />
                </div>

                {/* Key Title */}
                <h3 className="text-[16.5px] font-semibold tracking-[-0.015em] mb-1.5">
                  {eng.key}
                </h3>
                {/* Tag */}
                <p className={`text-sm ${isActive ? 'text-white/60' : 'text-neutral-400'}`}>
                  {eng.tag}
                </p>
              </button>
            );
          })}
        </div>

        {/* Highlight details box with responsive columns */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-5 bg-gradient-to-br from-[#f4f7fe] to-[#eaf0fd] border border-neutral-200/50 rounded-[26px] overflow-hidden">
          {/* Text block */}
          <div className="lg:col-span-2 p-8 md:p-12 self-center text-left">
            <span className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-neutral-400 block mb-4">
              {activeEngine.head}
            </span>
            <h3 className="text-2xl md:text-3xl font-semibold tracking-[-0.025em] text-neutral-900 mb-3.5">
              {activeEngine.key}
            </h3>
            <p className="text-sm md:text-[15.5px] text-neutral-500 leading-[1.66]">
              {activeEngine.body}
            </p>
          </div>

          {/* Illustration block */}
          <div className="lg:col-span-3 m-5 lg:ml-0 rounded-2xl overflow-hidden bg-white border border-neutral-200/30 shadow-md flex items-center justify-center min-h-[300px] md:min-h-[360px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex items-center justify-center p-4"
              >
                <img
                  src={activeEngine.img}
                  alt={activeEngine.key}
                  className="w-full max-h-[340px] object-contain"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
