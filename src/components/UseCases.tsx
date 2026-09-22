import { motion } from 'motion/react';
import { Sparkles, CheckCircle2, UserCheck, ShieldCheck } from 'lucide-react';

export default function UseCases() {
  const cases = [
    {
      title: 'Intelligent pre-qualified prospects',
      desc: 'Identify the prospects who already resemble your best customers, before a single outreach is made, so acquisition effort goes toward relationships worth building.',
      icon: UserCheck
    },
    {
      title: 'Smart prospect qualification',
      desc: 'Every prospect is scored against what actually predicts value for that segment, not a generic checklist, so a pipeline carries fewer names and more genuine intent.',
      icon: ShieldCheck
    },
    {
      title: 'Actionable customer engagement',
      desc: 'Every insight closes with a specific next step, the right merchant, offer, or channel, so understanding a customer becomes something a business can act on, not just something it knows.',
      icon: Sparkles
    },
    {
      title: 'Precision retention strategies',
      desc: 'Every retention effort is built around what a specific relationship actually values, replacing a blanket discount with the one reason that fits that customer alone.',
      icon: CheckCircle2
    }
  ];

  return (
    <section id="use-cases" className="py-24 lg:py-32 px-6 sm:px-12 max-w-[1440px] mx-auto border-t border-neutral-100 scroll-mt-20">
      <div>
        {/* Monospace eyebrow */}
        <div className="font-mono text-[11px] font-medium tracking-[0.34em] uppercase text-neutral-400">
          The Use Cases
        </div>
        {/* Title */}
        <h2 className="text-3xl md:text-[46px] font-medium tracking-[-0.03em] text-neutral-900 leading-[1.08] max-w-3xl mt-4">
          Four ways to put customer intelligence to work.
        </h2>
        {/* Subtitle */}
        <p className="text-sm md:text-[17px] text-neutral-500 max-w-2xl mt-4 leading-[1.6]">
          The same engine, applied wherever a business needs to know a customer better, before they convert, while they're being evaluated, and for as long as they stay.
        </p>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
          {cases.map((cs, idx) => {
            const Icon = cs.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="bg-white border border-neutral-200/60 rounded-[20px] p-7 shadow-sm hover:border-neutral-300 transition-all hover:scale-[1.01] flex flex-col justify-between group"
              >
                <div>
                  {/* Icon wrapper */}
                  <div className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white transition-all mb-6">
                    <Icon size={14} />
                  </div>
                  {/* Title */}
                  <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-neutral-900 mb-3">
                    {cs.title}
                  </h3>
                  {/* Desc */}
                  <p className="text-xs md:text-sm text-neutral-500 leading-[1.62]">
                    {cs.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
