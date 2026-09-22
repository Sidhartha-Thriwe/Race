import { motion } from 'motion/react';
import { HelpCircle, Target, EyeOff } from 'lucide-react';

export default function ProblemSection() {
  const problems = [
    {
      title: 'Good prospects are quiet too',
      desc: 'The customers most likely to become your best relationships rarely stand out at first contact. Without a way to spot fit early, they move through the same funnel as everyone else, and get treated like everyone else, until it\'s too late to prioritize them differently.',
      icon: HelpCircle,
      bg: 'from-blue-50/20 to-transparent'
    },
    {
      title: 'The generic prospect problem',
      desc: 'Treating every prospect the same is one of the most common reasons a pipeline underperforms. The prospect wasn\'t wrong to pursue. It just wasn\'t qualified for what it actually was.',
      icon: Target,
      bg: 'from-violet-50/20 to-transparent'
    },
    {
      title: 'The blind spot',
      desc: 'Most businesses hold the relationship with a customer, but not the insight into what that specific person actually needs next, to buy again, to stay, or to grow.',
      icon: EyeOff,
      bg: 'from-rose-50/20 to-transparent'
    }
  ];

  return (
    <section id="why-race" className="py-24 lg:py-32 px-6 sm:px-12 max-w-[1440px] mx-auto scroll-mt-20">
      <div>
        {/* Monospace eyebrow */}
        <div className="font-mono text-[11px] font-medium tracking-[0.34em] uppercase text-neutral-400">
          The Problem
        </div>
        {/* Header */}
        <h2 className="text-3xl md:text-[46px] font-medium tracking-[-0.03em] text-neutral-900 leading-[1.08] max-w-3xl mt-4">
          The signals are already there. Most businesses just aren't watching for them.
        </h2>

        {/* 3 Column Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {problems.map((prob, idx) => {
            const Icon = prob.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className={`bg-white border border-neutral-200/60 rounded-[22px] p-8 shadow-sm flex flex-col justify-between hover:border-neutral-300 transition-all bg-gradient-to-br ${prob.bg} group`}
              >
                <div>
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-500 mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-all">
                    <Icon size={16} />
                  </div>
                  {/* Title */}
                  <h3 className="text-lg font-semibold tracking-[-0.015em] text-neutral-900 mb-3">
                    {prob.title}
                  </h3>
                  {/* Desc */}
                  <p className="text-sm text-neutral-500 leading-[1.62]">
                    {prob.desc}
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
