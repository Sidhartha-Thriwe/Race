import { ShieldCheck, Lock, Eye, FileSpreadsheet } from 'lucide-react';

export default function SecurityCompliance() {
  const standards = [
    {
      title: 'ISO/IEC 27001',
      desc: 'Information security management system certification.',
      icon: ShieldCheck
    },
    {
      title: 'SOC 2 Type II',
      desc: 'Rigorous security, availability & confidentiality audits.',
      icon: Lock
    },
    {
      title: 'GDPR & DPDP aligned',
      desc: 'Strict global data privacy handling practices.',
      icon: Eye
    },
    {
      title: 'Minimal by design',
      desc: 'Only essential customer identifiers are required.',
      icon: FileSpreadsheet
    }
  ];

  return (
    <section className="py-24 lg:py-32 px-6 sm:px-12 max-w-[1440px] mx-auto border-t border-neutral-100">
      <div className="bg-[#fafbfd] border border-neutral-200/50 rounded-[28px] p-8 md:p-12 text-center">
        {/* Monospace eyebrow */}
        <div className="font-mono text-[11px] font-medium tracking-[0.34em] uppercase text-neutral-400">
          Data handled with care
        </div>
        {/* Title */}
        <h2 className="text-2xl md:text-[38px] font-medium tracking-[-0.028em] text-neutral-900 leading-[1.1] mt-4">
          Built on the standards this data category expects
        </h2>
        {/* Subtitle */}
        <p className="text-sm md:text-base text-neutral-500 max-w-xl mx-auto mt-4 leading-[1.6]">
          Security and privacy aren't an afterthought, they're part of how RACE is built from day one.
        </p>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-12 text-left">
          {standards.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-neutral-200/50 rounded-2xl p-6 hover:border-neutral-300 transition-all shadow-sm flex items-start gap-4 group"
              >
                <div className="p-2.5 rounded-xl bg-neutral-50 text-neutral-500 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0">
                  <Icon size={16} />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-neutral-900 mb-1.5">
                    {st.title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
