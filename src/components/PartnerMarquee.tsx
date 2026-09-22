export default function PartnerMarquee() {
  const partners = [
    { name: 'Standard Chartered', category: 'Banking' },
    { name: 'HSBC', category: 'Finance' },
    { name: 'HDFC Bank', category: 'Banking' },
    { name: 'Axis Bank', category: 'Banking' },
    { name: 'ICICI Bank', category: 'Banking' },
    { name: 'Mastercard', category: 'Payments' },
    { name: 'Visa', category: 'Payments' },
    { name: 'Amex', category: 'Payments' }
  ];

  return (
    <section className="py-20 lg:py-28 border-t border-neutral-100 text-center overflow-hidden">
      <div className="font-mono text-[11px] font-medium tracking-[0.34em] uppercase text-neutral-400">
        Trusted ecosystem
      </div>
      <h2 className="text-2xl md:text-3xl font-medium tracking-[-0.025em] text-neutral-900 leading-[1.1] mt-5 mb-10">
        Backed by Thriwe's partner network
      </h2>

      {/* Endless Marquee Row */}
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
        <div className="flex w-max gap-14 animate-marquee py-2">
          {/* Double list for smooth loop */}
          {[...partners, ...partners, ...partners].map((part, idx) => (
            <div
              key={idx}
              className="flex items-center justify-center min-w-[130px] h-14 rounded-2xl bg-white border border-neutral-200/50 hover:border-neutral-300 transition-all shadow-sm px-6 text-center select-none shrink-0"
            >
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-neutral-800 tracking-tight">{part.name}</span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-[#5d8ae8] mt-0.5">{part.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
