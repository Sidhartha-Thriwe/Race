import { motion } from 'motion/react';

export default function RaceMethod() {
  const steps = [
    {
      num: '01',
      eyebrow: 'Foundation',
      title: 'The Foundation',
      desc: 'RACE is built on 10 Lakh+ Thriwe B2C customer touchpoints worldwide, developed over years of direct relationships and shaped into a segmentation engine purpose-built for affluent, HNI, and UHNI spending behavior, not adapted from a generic mass-market model.'
    },
    {
      num: '02',
      eyebrow: 'Match',
      title: 'The Match',
      desc: 'At 99% accuracy, RACE matches a client\'s user base, whether prospects, cardholders, subscribers, policyholders, or loyalty members, against its pre-built segments. No cold modeling. No weeks spent waiting for a new dataset to learn.'
    },
    {
      num: '03',
      eyebrow: 'Strategy',
      title: 'The Strategy',
      desc: 'RACE then weighs 100+ real-world variables, including seasonality, purchase cycles, and macroeconomic shifts, to recommend a strategy built around the most effective merchants, offers, and channels for that audience.'
    }
  ];

  return (
    <section id="how-it-works" className="py-24 lg:py-32 px-6 sm:px-12 max-w-[1440px] mx-auto border-t border-neutral-100 scroll-mt-20">
      <div>
        {/* Monospace eyebrow */}
        <div className="font-mono text-[11px] font-medium tracking-[0.3em] uppercase text-neutral-400">
          How RACE works
        </div>

        {/* Title row */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mt-4">
          <h2 className="text-3xl md:text-[50px] font-medium tracking-[-0.035em] text-neutral-900 leading-[1.03]">
            The RACE Method
          </h2>
          <p className="text-sm md:text-[16.5px] text-neutral-500 max-w-xl leading-[1.58]">
            Most Customer Insight tools start from a blank slate and try to learn a client's customers from scratch. RACE starts somewhere else.
          </p>
        </div>

        {/* 3 Step Connected Cards */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {/* Connecting gradient line (hidden on mobile) */}
          <div className="hidden md:block absolute top-[52px] left-[5%] right-[5%] h-[1px] bg-gradient-to-r from-transparent via-[#5d8ae8]/45 to-transparent -z-10" />

          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="relative bg-white border border-neutral-200/60 rounded-3xl p-8 shadow-sm hover:border-neutral-300 transition-all hover:scale-[1.01] flex flex-col justify-between"
            >
              <div>
                {/* Step header */}
                <div className="flex items-center justify-between mb-6">
                  <span className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-semibold">
                    {step.num}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-400">
                    {step.eyebrow}
                  </span>
                </div>

                {/* Step content */}
                <h3 className="text-xl font-bold tracking-[-0.02em] text-neutral-900 mb-3.5">
                  {step.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-[1.66]">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-12 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-transparent border border-[#5d8ae8]/15 rounded-2xl p-6 md:p-8 text-sm md:text-base text-neutral-700 leading-[1.55] shadow-sm">
          The result: <strong className="text-neutral-900 font-semibold">more of the right customers found, understood, and kept</strong>, and a strategy grounded in data, not guesswork.
        </div>
      </div>
    </section>
  );
}
