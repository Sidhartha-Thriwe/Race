import React, { useState } from 'react';
import { useRaceRun, RaceRunPanel, StorageBadge, RunSpinner } from './RaceLiveRun';
import { RaceTargets } from './RaceTargets';
import { RaceScrape } from './RaceScrape';
import { RacePersona } from './RacePersona';
import { RaceCategories } from './RaceCategories';
import { 
  ArrowLeft, 
  Users, 
  Target, 
  ShieldCheck, 
  ChevronRight, 
  Briefcase, 
  Tag, 
  Mail, 
  Shield, 
  Sparkles,
  Info,
  Database
} from 'lucide-react';

export type CapabilityType = 'Customer Insight' | 'Lead Gen' | 'Lead Qualification';
export type SectorType = 'Automobile' | 'Luxury Watch' | 'Real Estate';

export const SECTOR_TICKET_PRICES: Record<SectorType, string[]> = {
  'Automobile': ['₹10–20L', '₹20–50L', '₹50L+'],
  'Luxury Watch': ['₹25k–50k', '₹50k–1L', '₹1L+'],
  'Real Estate': ['₹1–5Cr', '₹5–10Cr', '₹10Cr+']
};

interface CapabilityMeta {
  title: CapabilityType;
  description: string;
  actionVerb: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  requiresContact: boolean;
}

const CAPABILITIES: CapabilityMeta[] = [
  {
    title: 'Customer Insight',
    description: 'Scores and segments existing customer portfolios against behavioral propensities and psychographic models.',
    actionVerb: 'Run Customer Insight Scoring Pass',
    icon: Users,
    requiresContact: true
  },
  {
    title: 'Lead Gen',
    description: "Identifies and delivers pre-profiled, high-propensity prospects matched to target segment parameters from Thriwe's verified intelligence pool.",
    actionVerb: 'Generate Leads',
    icon: Target,
    requiresContact: false
  },
  {
    title: 'Lead Qualification',
    description: 'Screens and ranks incoming pipeline rosters against propensity benchmarks and risk qualification criteria before engagement.',
    actionVerb: 'Run Lead Qualification',
    icon: ShieldCheck,
    requiresContact: true
  }
];

export const InternalInsight: React.FC = () => {
  const [selectedCapability, setSelectedCapability] = useState<CapabilityType | null>(null);
  const [sector, setSector] = useState<SectorType>('Automobile');
  const [ticketPrice, setTicketPrice] = useState<string>(SECTOR_TICKET_PRICES['Automobile'][0]);
  const [contactEmail, setContactEmail] = useState<string>('');

  // The live engine. Customer Insight runs for real; the other two capabilities
  // are still scoping placeholders, so the CTA keeps its old no-op there.
  const { run, busy, error, hint, storage, subjects, estimateINR, spentThisMonth,
          bte, fromStore, start, loadSubject } = useRaceRun();
  const [loadedPlan, setLoadedPlan] = useState<any>(null);
  const [loadedScrape, setLoadedScrape] = useState<any>(null);
  const [loadedPersona, setLoadedPersona] = useState<any>(null);
  const [loadedCategories, setLoadedCategories] = useState<any>(null);
  /** The persona currently on screen, whether just built or loaded from storage. */
  const [activePersona, setActivePersona] = useState<any>(null);
  /** The plan currently on screen, whether just run or loaded from storage. */
  const [activePlan, setActivePlan] = useState<any>(null);
  const isLive = selectedCapability === 'Customer Insight';
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contactEmail.trim());
  const stored = subjects.find(
    (s) => (s.email ?? '').toLowerCase() === contactEmail.trim().toLowerCase());

  /**
   * Loading a subject snaps the form back to the sector and ticket price that
   * run actually used. Those inputs chose the vendor set, so showing the result
   * under different ones would quietly misrepresent how it was produced.
   */
  const applyBundle = (b: any) => {
    if (!b) return;
    setLoadedPlan(b.plan ?? null);
    setActivePlan(b.plan ?? null);
    setLoadedScrape(b.scrape ?? null);
    setLoadedPersona(b.persona ?? null);
    setActivePersona(b.persona ?? null);
    setLoadedCategories(b.categories ?? null);
    if (b.email) setContactEmail(b.email);
    const r = b.run ?? {};
    if (r.sector && ['Automobile', 'Luxury Watch', 'Real Estate'].includes(r.sector)) {
      setSector(r.sector as SectorType);
      const options = SECTOR_TICKET_PRICES[r.sector as SectorType];
      setTicketPrice(options.includes(r.ticketBand) ? r.ticketBand : options[0]);
    } else if (r.ticketBand && SECTOR_TICKET_PRICES[sector].includes(r.ticketBand)) {
      setTicketPrice(r.ticketBand);
    }
  };

  const handleSectorChange = (newSector: SectorType) => {
    setSector(newSector);
    // Automatically swap the ticket price list and set to the first valid option of the new sector
    const newOptions = SECTOR_TICKET_PRICES[newSector];
    setTicketPrice(newOptions[0]);
  };

  const handleSelectCapability = (cap: CapabilityType) => {
    setSelectedCapability(cap);
    setContactEmail('');
  };

  const currentCapabilityMeta = CAPABILITIES.find(c => c.title === selectedCapability);

  return (
    <div className="space-y-6 pb-16 font-sans select-none" id="super-admin-internal-insight">
      
      {/* Top Breadcrumb & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-neutral-400 font-semibold mb-1">
            <span className="flex items-center gap-1 text-[#2563eb]">
              <Shield size={12} />
              <span>Super Admin</span>
            </span>
            <span>/</span>
            <span>Internal Insight</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Internal Insight
          </h2>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Walk prospects through Thriwe's live intelligence capabilities using real domain parameters.
          </p>
        </div>

        {selectedCapability && (
          <button
            type="button"
            onClick={() => setSelectedCapability(null)}
            className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            id="internal-insight-back-btn"
          >
            <ArrowLeft size={13} />
            <span>Back to Capabilities</span>
          </button>
        )}
      </div>

      {/* Screen 1: Landing — Capability Cards */}
      {!selectedCapability ? (
        <div className="space-y-6" id="internal-insight-screen-1">
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 mb-1">
              <Sparkles size={14} className="text-[#2563eb]" />
              <span>Select Capability to Configure</span>
            </div>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed max-w-2xl">
              Choose one of the three core intelligence modules below to open its dedicated parameter configuration form.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  onClick={() => handleSelectCapability(cap.title)}
                  className="bg-white hover:bg-neutral-50/70 border border-neutral-200 hover:border-[#2563eb]/50 rounded-xl p-6 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group text-left"
                  id={`capability-card-${cap.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="space-y-3.5">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 group-hover:bg-blue-50 border border-neutral-200 group-hover:border-blue-200 flex items-center justify-center transition-colors">
                      <Icon size={20} className="text-neutral-700 group-hover:text-[#2563eb] transition-colors" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-neutral-900 group-hover:text-[#2563eb] transition-colors">
                        {cap.title}
                      </h3>
                      <p className="text-xs text-neutral-600 font-normal leading-relaxed">
                        {cap.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-neutral-100 flex items-center justify-between text-xs font-bold text-neutral-500 group-hover:text-[#2563eb] transition-colors">
                    <span>Configure parameters</span>
                    <ChevronRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Screen 2: Configuration Form (Per Capability) */
        <div className="max-w-2xl space-y-6" id="internal-insight-screen-2">
          
          {/* Capability Label — Read-only Header */}
          <div className="bg-neutral-900 text-white rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold block">
                Selected Capability (Read-Only)
              </span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {currentCapabilityMeta && (
                  <currentCapabilityMeta.icon size={18} className="text-[#60a5fa]" />
                )}
                <span>{selectedCapability}</span>
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-white/10 rounded-md border border-white/10 text-neutral-200">
              Module Config
            </span>
          </div>

          {/* Configuration Form Card */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs space-y-5">
            
            {/* Sector Dropdown */}
            <div className="space-y-1.5">
              <label 
                htmlFor="sector-dropdown" 
                className="block text-xs font-bold text-neutral-700 flex items-center gap-1.5"
              >
                <Briefcase size={13} className="text-neutral-500" />
                <span>Sector</span>
              </label>
              <select
                id="sector-dropdown"
                value={sector}
                onChange={(e) => handleSectorChange(e.target.value as SectorType)}
                className="w-full px-3.5 py-2.5 text-xs font-medium text-neutral-800 bg-white border border-neutral-300 rounded-lg shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all cursor-pointer"
              >
                <option value="Automobile">Automobile</option>
                <option value="Luxury Watch">Luxury Watch</option>
                <option value="Real Estate">Real Estate</option>
              </select>
              <p className="text-[10.5px] text-neutral-400 font-medium">
                Selecting a sector adjusts the applicable ticket price bracket options dynamically.
              </p>
            </div>

            {/* Ticket Price Dropdown (Options Set strictly by Sector) */}
            <div className="space-y-1.5">
              <label 
                htmlFor="ticket-price-dropdown" 
                className="block text-xs font-bold text-neutral-700 flex items-center gap-1.5"
              >
                <Tag size={13} className="text-neutral-500" />
                <span>Ticket Price</span>
              </label>
              <select
                id="ticket-price-dropdown"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-medium text-neutral-800 bg-white border border-neutral-300 rounded-lg shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all cursor-pointer"
              >
                {SECTOR_TICKET_PRICES[sector].map((priceOption) => (
                  <option key={priceOption} value={priceOption}>
                    {priceOption}
                  </option>
                ))}
              </select>
              <p className="text-[10.5px] text-neutral-400 font-medium">
                Sector-specific valuation tiers configured for {sector}.
              </p>
            </div>

            {/* Contact (Email) Input:
                Present ONLY for Customer Insight and Lead Qualification.
                NOT PRESENT AT ALL for Lead Gen (not hidden, not disabled, literally not rendered).
            */}
            {/* Load a stored subject — free, no vendor call. Exists so testing and
                demoing never has to re-bill an address already resolved. */}
            {isLive && subjects.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                  <Database size={13} className="text-neutral-500" />
                  <span>Load stored subject</span>
                  <span className="ml-auto text-[10px] font-medium text-neutral-400">free</span>
                </label>
                <select
                  value=""
                  disabled={busy}
                  onChange={async (e) => {
                    if (!e.target.value) return;
                    const b = await loadSubject(e.target.value);
                    applyBundle(b);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-neutral-800 bg-white border border-neutral-300 rounded-lg shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all cursor-pointer disabled:bg-neutral-50"
                  id="race-subject-picker"
                >
                  <option value="">Select a previously resolved subject…</option>
                  {subjects.map((sub) => (
                    <option key={sub.subjectId} value={sub.subjectId}>
                      {sub.subjectId} · {sub.email ?? 'unknown'}
                      {sub.lastRunAt ? ` · ${sub.lastRunAt.slice(0, 10)}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10.5px] text-neutral-400 font-medium">
                  Loads the stored result and its scrape plan. Nothing is called and nothing billed.
                </p>
              </div>
            )}

            {selectedCapability !== 'Lead Gen' && (
              <div className="space-y-1.5" id="contact-email-field-group">
                <label 
                  htmlFor="contact-email-input" 
                  className="block text-xs font-bold text-neutral-700 flex items-center gap-1.5"
                >
                  <Mail size={13} className="text-neutral-500" />
                  <span>Contact (email)</span>
                  {isLive && <span className="ml-auto"><StorageBadge storage={storage} /></span>}
                </label>
                <input
                  type="email"
                  id="contact-email-input"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. prospect@enterprise.com"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-neutral-800 bg-white border border-neutral-300 rounded-lg shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all placeholder:text-neutral-400"
                />
                <p className="text-[10.5px] text-neutral-400 font-medium">
                  {selectedCapability} processes specific subject profiles from input rosters.
                </p>
              </div>
            )}

            {/* CTA Button — Labeled with the real product's own action verb for this capability */}
            <div className="pt-3 border-t border-neutral-100 space-y-2">
              {isLive && stored && (
                <div className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <div className="text-[10.5px] font-bold text-neutral-700">
                    Already resolved as {stored.subjectId}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    {stored.lastRunAt?.slice(0, 16).replace('T', ' ')}
                    {stored.costINR != null && ` · ₹${stored.costINR.toFixed(2)} spent`}
                  </div>
                </div>
              )}

              <div className={isLive && stored ? 'grid grid-cols-2 gap-2' : ''}>
                {isLive && stored && (
                  <button
                    type="button" disabled={busy}
                    onClick={async () => applyBundle(await loadSubject(stored.subjectId))}
                    className="py-3 px-4 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    id="race-load-stored-btn"
                  >
                    <Database size={13} />
                    <span>Load stored result</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isLive && (busy || !emailValid)}
                  onClick={() => {
                    if (!isLive) return; // still a scoping placeholder for the other two
                    setLoadedPlan(null); setActivePlan(null);
                    setLoadedScrape(null); setLoadedPersona(null);
                    start({ email: contactEmail, sector, ticketBand: ticketPrice,
                            useCase: 'customer_insight' });
                  }}
                  className={`py-3 px-4 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-99 ${
                    isLive && (busy || !emailValid)
                      ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                      : isLive && stored
                        ? 'bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50 cursor-pointer'
                        : 'bg-[#1e40af] hover:bg-[#1d4ed8] text-white cursor-pointer'
                  } ${isLive && stored ? '' : 'w-full'}`}
                  id="internal-insight-cta-btn"
                >
                  {isLive && busy && <RunSpinner />}
                  <span>
                    {isLive && busy
                      ? 'Fetching and storing…'
                      : isLive
                        ? `${stored ? 'Re-run' : currentCapabilityMeta?.actionVerb}` +
                          (estimateINR ? ` · ₹${estimateINR.toFixed(2)}` : '')
                        : currentCapabilityMeta?.actionVerb || 'Execute'}
                  </span>
                </button>
              </div>

              {/*
                * The screening pass — one vendor, ₹0.34.
                *
                * Behind the Email is ~180x cheaper than OSINT Industries, so a
                * one-call look is the honest way to check an address before
                * spending on the full set. It is marked as screening, so it
                * never becomes the evidence base steps 4 and 5 reason from.
                */}
              {isLive && bte?.ok && emailValid && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => start({
                    email: contactEmail, sector, ticketBand: ticketPrice,
                    useCase: 'customer_insight',
                    vendors: ['behind_the_email'],
                  })}
                  className={`w-full py-2 rounded-lg font-bold text-[11px] border transition-all ${
                    busy
                      ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50 cursor-pointer'}`}
                  id="race_screen_btn"
                >
                  Screening pass — Behind the Email only · ₹0.34
                </button>
              )}

              {isLive && (
                <p className="text-[10px] text-neutral-400 text-center">
                  {spentThisMonth != null && <>₹{spentThisMonth.toFixed(2)} spent this month</>}
                  {bte && (
                    <span className={bte.ok ? 'text-emerald-600 ml-2' : 'text-amber-600 ml-2'}>
                      · BTE key {bte.ok ? 'verified' : `not usable — ${bte.error}`}
                    </span>
                  )}
                </p>
              )}

              {isLive && <RaceRunPanel run={run} error={error} hint={hint}
                                       email={contactEmail} storage={storage}
                                       fromStore={fromStore} />}

              {/* Step 2 — plan only. Enabled once step 1 has a subject id. */}
              {isLive && run?.subjectId && (
                <>
                  <RaceTargets subjectId={run.subjectId} enabled={run.status === 'completed'}
                               initialPlan={loadedPlan} onPlan={setActivePlan} />

                  {/* Step 3 — runs the reviewed plan. Spends. */}
                  <RaceScrape
                    subjectId={run.subjectId}
                    ready={activePlan?.ready ?? []}
                    enabled={Boolean(activePlan?.ready?.length)}
                    initialScrape={loadedScrape}
                    onComplete={setLoadedScrape}
                  />

                  {/* Step 4 — attributes and the computed layer. */}
                  <RacePersona
                    subjectId={run.subjectId}
                    enabled={Boolean(loadedScrape)}
                    initialPersona={loadedPersona}
                    onPersona={setActivePersona}
                  />

                  {/* Step 5 — ranked categories. Stops at the category. */}
                  <RaceCategories
                    subjectId={run.subjectId}
                    enabled={Boolean(activePersona?.attributeGroups?.length)}
                    initialCategories={loadedCategories}
                  />
                </>
              )}

              <div className="flex items-center justify-between text-[10.5px] text-neutral-400 font-medium px-1">
                <span className="flex items-center gap-1 text-neutral-500">
                  {isLive
                    ? <><ShieldCheck size={12} /><span>Live — calls the vendor and stores the result.</span></>
                    : <><Info size={12} /><span>Action is parked for current scoping round.</span></>}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCapability(null)}
                  className="text-neutral-500 hover:text-neutral-800 font-bold hover:underline cursor-pointer"
                >
                  Change Capability
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
