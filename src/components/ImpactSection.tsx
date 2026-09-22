import { motion } from 'motion/react';
import { Layers, Rocket, CheckCircle } from 'lucide-react';

export default function ImpactSection() {
  const impacts = [
    {
      title: 'Nothing new to build',
      desc: 'RACE activates with the identifiers a client already has. No new infrastructure, no data science team to stand up, no multi-month integration before the first result.',
      icon: Layers
    },
    {
      title: 'No ramp-up period',
      desc: 'Because the segmentation layer is already built, matching and strategy generation start immediately, not after weeks of a system learning a new audience.',
      icon: Rocket
    },
    {
      title: 'Consistent, not one-off',
      desc: 'Every recommendation runs through the same tested segmentation and multi-variable strategy layer, so results hold up consistently, not a single campaign that happened to work once.',
      icon: CheckCircle
    }
  ];

  return (
    <section className="py-24 lg:py-32 px-6 sm:px-12 max-w-[1440px] mx-auto border-t border-neutral-100 text-center">
      <div>
        {/* Monospace eyebrow */}
        <div className="font-mono text-[11px] font-medium tracking-[0.34em] uppercase text-neutral-400">
          The Impact
        </div>
        {/* Header */}
        <h2 className="text-3xl md:text-[46px] font-medium tracking-[-0.03em] text-neutral-900 leading-[1.08] max-w-3xl mx-auto mt-4">
          Customer intelligence that's easier, faster, and actually works.
        </h2>

        {/* 3 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
          {impacts.map((imp, idx) => {
            const Icon = imp.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="bg-gradient-to-b from-[#fbfcff] to-[#f5f8fe] border border-neutral-200/60 rounded-[22px] p-8 hover:border-neutral-300 transition-all shadow-sm group"
              >
                {/* Icon wrapper */}
                <div className="w-9 h-9 rounded-xl bg-white border border-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white transition-all mb-6 shadow-sm">
                  <Icon size={15} />
                </div>
                {/* Title */}
                <h3 className="text-[19px] font-semibold tracking-[-0.018em] text-neutral-900 mb-3">
                  {imp.title}
                </h3>
                {/* Desc */}
                <p className="text-sm text-neutral-500 leading-[1.64]">
                  {imp.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
