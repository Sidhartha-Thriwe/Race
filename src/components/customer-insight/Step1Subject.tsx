import React from 'react';
import { CustomerInsightRunData, SectorType, SECTOR_TICKET_PRICES } from './types';
import { SubjectSummary } from '../RaceLiveRun';
import { Loader2 } from 'lucide-react';

interface Step1SubjectProps {
  data: CustomerInsightRunData;
  subjects: SubjectSummary[];
  busy: boolean;
  onUpdate: (partial: Partial<CustomerInsightRunData>) => void;
  onRunIdentityMatch: () => void;
  onLoadSubject: (subjectId: string) => void;
}

export const Step1Subject: React.FC<Step1SubjectProps> = ({
  data,
  subjects,
  busy,
  onUpdate,
  onRunIdentityMatch,
  onLoadSubject,
}) => {
  const handleSectorChange = (sector: SectorType) => {
    const prices = SECTOR_TICKET_PRICES[sector] || [];
    onUpdate({ sector, ticketPrice: prices[0] || '' });
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim());
  const canRun = data.isStored
    ? true
    : (isEmailValid && data.isLawfulConsent && !busy);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-semibold mb-1">
          STEP 1 OF 6
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
          Configure
        </h2>
        <p className="text-xs text-neutral-500 font-medium mt-1">
          Pick the sector, then add a contact or load a stored subject.
        </p>
      </div>

      {/* Main Grid: Form + Run Estimate */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Card */}
        <div className="lg:col-span-12 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          {/* Row 1: Sector & Ticket Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="sector-select" className="block text-xs font-semibold text-neutral-700">
                Sector
              </label>
              <div className="relative">
                <select
                  id="sector-select"
                  value={data.sector}
                  onChange={(e) => handleSectorChange(e.target.value as SectorType)}
                  className="w-full appearance-none px-3.5 py-2.5 text-xs font-medium text-neutral-800 bg-white border border-neutral-200 rounded-xl shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#1e293b]/20 focus:border-[#1e293b] cursor-pointer"
                >
                  <option value="Automobile">Automobile</option>
                  <option value="Luxury Watch">Luxury Watch</option>
                  <option value="Real Estate">Real Estate</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ticket-select" className="block text-xs font-semibold text-neutral-700">
                Ticket price
              </label>
              <div className="relative">
                <select
                  id="ticket-select"
                  value={data.ticketPrice}
                  onChange={(e) => onUpdate({ ticketPrice: e.target.value })}
                  className="w-full appearance-none px-3.5 py-2.5 text-xs font-medium text-neutral-800 bg-white border border-neutral-200 rounded-xl shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#1e293b]/20 focus:border-[#1e293b] cursor-pointer"
                >
                  {(SECTOR_TICKET_PRICES[data.sector] || []).map((price) => (
                    <option key={price} value={price}>
                      {price}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Subject Segmented Switcher */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-700">
              Subject
            </label>
            <div className="grid grid-cols-2 p-1 bg-neutral-100/90 rounded-xl border border-neutral-200/60">
              <button
                type="button"
                onClick={() => onUpdate({ isStored: false })}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  !data.isStored
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                New contact
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ isStored: true })}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  data.isStored
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Stored subject · free
              </button>
            </div>
          </div>

          {/* Contact Input / Stored Subject Picker */}
          {!data.isStored ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="contact-email" className="block text-xs font-semibold text-neutral-700">
                  Contact email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={data.email}
                  onChange={(e) => onUpdate({ email: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-neutral-800 bg-white border border-neutral-200 rounded-xl shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#1e293b]/20 focus:border-[#1e293b] placeholder:text-neutral-400"
                />
              </div>

              {/* Model: how many sources the run calls */}
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-neutral-700">Model</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" role="radiogroup" aria-label="Model">
                  {([
                    { id: 'pluto', name: 'Pluto', hint: '1 source', locked: false },
                    { id: 'earth', name: 'Earth', hint: '2 sources', locked: false },
                    { id: 'jupiter', name: 'Jupiter', hint: 'Needs admin access', locked: true },
                  ] as const).map((m) => {
                    const selected = data.tier === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={m.locked}
                        onClick={() => onUpdate({ tier: m.id })}
                        className={`text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                          m.locked
                            ? 'bg-neutral-50 border-neutral-200/70 text-neutral-400 cursor-not-allowed'
                            : selected
                            ? 'bg-white border-[#1e293b] ring-2 ring-[#1e293b]/10 cursor-pointer'
                            : 'bg-white border-neutral-200 hover:border-neutral-300 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-bold ${m.locked ? 'text-neutral-400' : 'text-neutral-900'}`}>{m.name}</span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            selected ? 'border-[#1e293b]' : 'border-neutral-300'
                          }`}>
                            {selected && <span className="w-1.5 h-1.5 rounded-full bg-[#1e293b]" />}
                          </span>
                        </div>
                        <div className={`text-[11px] font-medium mt-0.5 ${m.locked ? 'text-amber-600' : 'text-neutral-500'}`}>
                          {m.hint}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lawful consent check */}
              <label className="flex items-center gap-3 p-3.5 bg-neutral-50/80 border border-neutral-200/60 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors">
                <input
                  type="checkbox"
                  checked={data.isLawfulConsent}
                  onChange={(e) => onUpdate({ isLawfulConsent: e.target.checked })}
                  className="w-4 h-4 rounded-md text-[#1e293b] border-neutral-300 focus:ring-[#1e293b] accent-[#1e293b] cursor-pointer"
                />
                <span className="text-xs text-neutral-600 font-medium">
                  This contact was collected lawfully and may be processed for this purpose.
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label htmlFor="stored-subject-select" className="block text-xs font-semibold text-neutral-700">
                Select stored subject
              </label>
              <div className="relative">
                <select
                  id="stored-subject-select"
                  value={data.subjectId}
                  onChange={(e) => {
                    const subId = e.target.value;
                    onUpdate({ subjectId: subId });
                    if (subId) onLoadSubject(subId);
                  }}
                  className="w-full appearance-none px-3.5 py-2.5 text-xs font-medium text-neutral-800 bg-white border border-neutral-200 rounded-xl shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#1e293b]/20 focus:border-[#1e293b] cursor-pointer"
                >
                  <option value="" disabled>{subjects.length ? 'Choose a stored subject' : 'No stored subjects yet'}</option>
                  {subjects.map((s) => (
                    <option key={s.subjectId} value={s.subjectId}>
                      {s.subjectId} · {s.email ?? 'stored profile'}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
            <button
              type="button"
              disabled={!canRun}
              onClick={onRunIdentityMatch}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer ${
                canRun
                  ? 'bg-[#1e293b] hover:bg-[#0f172a] text-white'
                  : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
              }`}
            >
              {busy ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>
                  {data.isStored
                    ? 'Load stored subject · free'
                    : 'Run Sourcing'}
                </span>
              )}
            </button>
            <span className="text-xs text-neutral-500 font-medium">
              About 3–4 minutes end to end
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
