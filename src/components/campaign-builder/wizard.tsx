import React from 'react';
import { Check, ChevronRight, ChevronDown, ArrowLeft, ShieldCheck, Mail, AlertCircle, Lock, Wallet, Coins, Sparkles, TrendingUp } from 'lucide-react';

/* Shared building blocks for the 4-step campaign builders
   (Lead Gen, Lead Qualification, Customer Insight). Clean, Professional SaaS Design System. */

export type BuilderKind = 'leadgen' | 'qualification' | 'insight';

export interface WalletCostInfo {
  currentBalance?: number;
  campaignCost: number;
  costLabel?: string;
  costSubtext?: string;
  unitRateLabel?: string;
  unitRateValue?: string;
  pacingNote?: string;
}

export interface ClientStripProfile {
  name: string;
  industry: string;
  ticketSize: number;
  purchaseChannel: string;
}

export interface CampaignConsent {
  acknowledgedAt: string; // ISO timestamp
  items: { id: string; text: string }[];
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const REQUIRED_EMAILS = 5;

export const isValidEmail = (v: string) => EMAIL_RE.test(v.trim());

/** Valid + unique (case-insensitive) emails, in entry order. */
export const cleanEmails = (emails: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  emails.forEach((e) => {
    const t = e.trim();
    if (!isValidEmail(t)) return;
    const k = t.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(t);
  });
  return out;
};

export const hasInvalidEmails = (emails: string[]): boolean => {
  const lower = emails.map((e) => e.trim().toLowerCase());
  return emails.some((e, i) => {
    const t = e.trim();
    if (t === '') return false;
    const valid = isValidEmail(t);
    const dup = valid && lower.indexOf(t.toLowerCase()) !== i;
    return !valid || dup;
  });
};

export const emailsComplete = (emails: string[]) => cleanEmails(emails).length >= REQUIRED_EMAILS;

const formatTicket = (amt: number) => {
  if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(amt % 10000000 === 0 ? 0 : 1)} Cr`;
  if (amt >= 100000) return `₹${(amt / 100000).toFixed(amt % 100000 === 0 ? 0 : 1)}L`;
  return `₹${amt.toLocaleString('en-IN')}`;
};

/* ---------- Header + client strip + stepper ---------- */

export const WizardHeader: React.FC<{
  section: string;
  title: string;
  subtitle: string;
  client: ClientStripProfile;
  steps: string[];
  step: number; // 1-based
  onCancel: () => void;
  onJump?: (n: number) => void;
}> = ({ section, title, subtitle, client, steps, step, onCancel, onJump }) => (
  <div className="flex flex-col gap-4 pb-2 select-none">
    {/* Top Breadcrumb & Cancel */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] uppercase text-neutral-400 font-semibold">
        <button 
          type="button" 
          onClick={onCancel} 
          className="hover:text-neutral-700 transition-colors cursor-pointer"
        >
          {section}
        </button>
        <span className="text-neutral-300">/</span>
        <span className="text-neutral-600">Campaign Builder</span>
      </div>
      <button 
        type="button" 
        onClick={onCancel} 
        className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
      >
        Cancel
      </button>
    </div>

    {/* Title & Client Badge */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h2>
        <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Verified Client Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200/80 rounded-lg shadow-xs self-start sm:self-auto">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-semibold text-neutral-900">{client.name}</span>
        <span className="text-neutral-300">·</span>
        <span className="text-xs text-neutral-500">{client.industry}</span>
        <span className="text-neutral-300">·</span>
        <span className="text-xs font-medium text-neutral-600">Ticket {formatTicket(client.ticketSize)}</span>
      </div>
    </div>

    {/* Modern Stepper */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1" role="list" aria-label="Progress">
      {steps.map((label, i) => {
        const n = i + 1;
        const on = n === step;
        const done = n < step;
        const clickable = done && !!onJump;
        return (
          <button
            key={label}
            type="button"
            role="listitem"
            aria-current={on ? 'step' : undefined}
            disabled={!clickable}
            onClick={() => clickable && onJump!(n)}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              on 
                ? 'bg-blue-50/60 border-blue-500/80 ring-1 ring-blue-500/20 shadow-xs' 
                : done 
                ? 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50 cursor-pointer shadow-xs' 
                : 'bg-neutral-50/60 border-neutral-200/60 opacity-60 cursor-default'
            }`}
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold transition-colors shrink-0 ${
              on 
                ? 'bg-blue-600 text-white shadow-xs' 
                : done 
                ? 'bg-neutral-900 text-white' 
                : 'bg-neutral-200 text-neutral-500'
            }`}>
              {done ? <Check size={12} className="stroke-[3]" /> : n}
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-[10px] uppercase font-mono tracking-wider font-semibold ${on ? 'text-blue-600' : 'text-neutral-400'}`}>
                Step {n}
              </div>
              <div className={`text-xs font-semibold truncate ${on ? 'text-neutral-900' : done ? 'text-neutral-700' : 'text-neutral-500'}`}>
                {label}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

/* ---------- Card + Collapsible Card + footer ---------- */

export const WizardCard: React.FC<{ title?: string; lead?: string; badge?: string; children: React.ReactNode }> = ({ title, lead, badge, children }) => (
  <div className="bg-white border border-neutral-200/80 rounded-xl p-5 sm:p-7 shadow-xs w-full flex flex-col gap-6">
    {title && (
      <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-3.5">
        <div>
          <h3 className="text-base font-bold text-neutral-900 tracking-tight">{title}</h3>
          {lead && <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{lead}</p>}
        </div>
        {badge && (
          <span className="px-2.5 py-1 rounded-md bg-neutral-100 border border-neutral-200/60 text-[10px] font-semibold uppercase font-mono text-neutral-600">
            {badge}
          </span>
        )}
      </div>
    )}
    {children}
  </div>
);

export const CollapsibleCard: React.FC<{
  title: string;
  badge?: string;
  lead?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, badge = 'Optional', lead, isOpen, onToggle, children }) => (
  <div className="bg-white border border-neutral-200/80 rounded-xl shadow-xs w-full overflow-hidden transition-all">
    <button
      type="button"
      onClick={onToggle}
      className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-neutral-50/60 transition-colors cursor-pointer select-none"
    >
      <div className="flex items-center gap-2.5">
        <h3 className="text-sm font-bold text-neutral-900 tracking-tight">{title}</h3>
        {badge && (
          <span className="px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200/60 text-[10px] font-semibold uppercase font-mono text-neutral-600">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
        <span>{isOpen ? 'Collapse options' : 'Expand options'}</span>
        <ChevronDown size={15} className={`text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
    </button>
    {isOpen && (
      <div className="px-5 pb-6 sm:px-6 sm:pb-7 pt-4 border-t border-neutral-100 flex flex-col gap-6 animate-in fade-in-50 duration-150">
        {lead && <p className="text-xs text-neutral-500 -mt-1 leading-relaxed">{lead}</p>}
        {children}
      </div>
    )}
  </div>
);

export const WizardFooter: React.FC<{
  step: number;
  total?: number;
  onBack: () => void;
  backLabel?: string;
  onNext?: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  progressNote?: string;
  onDraft?: () => void;
}> = ({ step, total = 4, onBack, backLabel, onNext, nextLabel, nextDisabled, progressNote, onDraft }) => (
  <div className="flex items-center justify-between pt-4 border-t border-neutral-200/70 mt-4">
    <div>
      {onDraft ? (
        <button 
          type="button" 
          onClick={onDraft} 
          className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          Save as draft
        </button>
      ) : (
        <button 
          type="button" 
          onClick={onBack} 
          className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          {backLabel ?? (step === 1 ? 'Cancel' : 'Back')}
        </button>
      )}
    </div>
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-mono text-neutral-400 font-medium">{progressNote ?? `Step ${step} of ${total}`}</span>
      {onDraft && (
        <button 
          type="button" 
          onClick={onBack} 
          className="h-9 px-4 text-xs font-semibold bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-lg shadow-xs transition-all cursor-pointer"
        >
          Back
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="h-9 sm:h-10 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
      >
        <span>{nextLabel}</span>
        <ChevronRight size={14} />
      </button>
    </div>
  </div>
);

/* ---------- Step 3: top-5 emails ---------- */

export const TopEmailsStep: React.FC<{
  emails: string[];
  onChange: (next: string[]) => void;
  lead: string;
  noteTail: string; // e.g. "not added to your audience file"
}> = ({ emails, onChange, lead, noteTail }) => {
  const lower = emails.map((e) => e.trim().toLowerCase());
  const added = cleanEmails(emails).length;
  return (
    <WizardCard title="Share your top 5 customer emails" badge="Optional" lead={lead}>
      <div className="flex flex-col gap-3 max-w-2xl">
        {Array.from({ length: REQUIRED_EMAILS }).map((_, i) => {
          const v = emails[i] ?? '';
          const t = v.trim();
          const valid = t !== '' && isValidEmail(t);
          const dup = valid && lower.indexOf(t.toLowerCase()) !== i;
          const bad = t !== '' && (!valid || dup);
          return (
            <div key={i}>
              <div className="flex items-center gap-3">
                <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  valid && !dup ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                }`}>
                  {i + 1}
                </span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  aria-label={`Email ${i + 1} (Optional)`}
                  aria-invalid={bad}
                  placeholder={`name${i + 1}@company.com (Optional)`}
                  value={v}
                  onChange={(e) => {
                    const next = [...emails];
                    while (next.length < REQUIRED_EMAILS) next.push('');
                    next[i] = e.target.value;
                    onChange(next);
                  }}
                  className={inputCls(bad)}
                />
              </div>
              {bad && (
                <p className="ml-11 mt-1 text-[11px] font-medium text-rose-500">
                  {dup ? 'This email is already listed.' : 'Enter a valid email address or leave blank.'}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="max-w-2xl rounded-lg bg-blue-50/60 border border-blue-100/80 px-4 py-3 text-xs leading-relaxed text-blue-900 flex items-start gap-2.5">
        <Mail size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Optional Step:</span> If provided, emails are used only to improve matching accuracy for this campaign. They are {noteTail} or shared with any third party. You can continue with or without adding emails.
        </div>
      </div>
      <span className="sr-only" aria-live="polite">{added} of {REQUIRED_EMAILS} added</span>
    </WizardCard>
  );
};

/* ---------- Step 4: review + 4 acknowledgements ---------- */

export interface SummarySection { heading: string; rows: [string, string][] }

export const getAcknowledgements = (kind: BuilderKind): { id: string; text: string }[] => {
  const purpose =
    kind === 'insight'
      ? 'used for behavioural and psychological profiling, not only for contact'
      : kind === 'qualification'
      ? 'used to qualify and score them for this campaign'
      : 'used to build audience profiles and find similar prospects';
  const shared = kind === 'leadgen' ? 'The emails and information I have shared were' : 'The audience file and emails I have shared were';
  return [
    { id: 'lawful', text: `${shared} collected lawfully, and I am authorised to share them with Thriwe.` },
    { id: 'consent', text: `The people concerned have agreed that their information may be ${purpose}.` },
    { id: 'emails', text: 'I understand that any top customer emails shared are used only to improve matching accuracy for this campaign.' },
    { id: 'optout', text: 'I will respect opt-out and Do-Not-Disturb requests, and can share consent records if asked.' },
  ];
};

export const ReviewConsentStep: React.FC<{
  kind: BuilderKind;
  sections: SummarySection[];
  acks: boolean[];
  onToggle: (i: number) => void;
  actionWord: string; // "launch" | "run"
  walletCost?: WalletCostInfo;
}> = ({ kind, sections, acks, onToggle, actionWord, walletCost }) => {
  const items = getAcknowledgements(kind);
  const count = acks.filter(Boolean).length;

  const balance = walletCost?.currentBalance ?? 1000000;
  const cost = walletCost?.campaignCost ?? 0;
  const remaining = Math.max(0, balance - cost);
  const isSufficient = balance >= cost;
  const pctBlocked = balance > 0 ? Math.min(100, Math.max(0, Math.round((cost / balance) * 100))) : 0;
  const pctRemaining = Math.max(0, 100 - pctBlocked);

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Review Parameters & Compliance Acknowledgements Grid */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <WizardCard title="Campaign Review" lead="Verify configured parameters before launch.">
          <div className="flex flex-col divide-y divide-neutral-100 -mt-2">
            {sections.map((s) => (
              <div key={s.heading} className="py-3.5 first:pt-0 last:pb-0">
                <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  {s.heading}
                </h4>
                <div className="space-y-2">
                  {s.rows.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500">{k}</span>
                      <span className="font-semibold text-neutral-900 text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </WizardCard>

        <WizardCard title={`Before you ${actionWord}`} lead="A quick confirmation, so everyone is comfortable. Please tick all four.">
          <div className="flex flex-col gap-2.5 -mt-2">
            {items.map((it, i) => (
              <div 
                key={it.id} 
                onClick={() => onToggle(i)}
                className={`flex items-start gap-3 rounded-lg border p-3.5 cursor-pointer transition-all ${
                  acks[i] 
                    ? 'border-blue-200 bg-blue-50/50 shadow-xs' 
                    : 'border-neutral-200 bg-white hover:bg-neutral-50'
                }`}
              >
                <input 
                  id={`ack-${it.id}`} 
                  type="checkbox" 
                  checked={!!acks[i]} 
                  onChange={() => onToggle(i)} 
                  className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500" 
                />
                <label htmlFor={`ack-${it.id}`} className="cursor-pointer text-xs leading-relaxed text-neutral-800 font-medium select-none">
                  {it.text}
                </label>
              </div>
            ))}
          </div>
          <div className="text-xs text-neutral-500 flex items-center justify-between pt-1" aria-live="polite">
            <span className="font-semibold text-neutral-700">{count} of 4 confirmed</span>
            {count < 4 && (
              <span className="text-neutral-400 text-[11px]">
                Tick all four to enable {actionWord === 'run' ? 'Running' : 'Launch'}
              </span>
            )}
          </div>
        </WizardCard>
      </div>

      {/* 2. Small, Subtle, Low-Height Wallet & Campaign Spend Section */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:px-5 sm:py-3.5 shadow-2xs w-full flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Wallet size={13} />
            </div>
            <span className="text-xs font-bold text-neutral-900 tracking-tight">
              Wallet &amp; Campaign Spend
            </span>
            {walletCost?.costSubtext && (
              <span className="text-[11px] text-neutral-400 hidden sm:inline">
                · {walletCost.costSubtext}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isSufficient ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/60 text-[11px] font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sufficient Balance
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200/60 text-[11px] font-semibold text-amber-700">
                <AlertCircle size={11} />
                Low Balance
              </span>
            )}
          </div>
        </div>

        {/* 3 Compact Metric Cards with Subtle Operation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
          {/* Card 1: Available */}
          <div className="px-3 py-2 rounded-lg bg-neutral-50/80 border border-neutral-200/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-medium">Available Balance</div>
              <div className="text-sm font-bold text-neutral-900 mt-0.5">{fmt(balance)}</div>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">Current</span>
          </div>

          {/* Card 2: To be utilised spend */}
          <div className="px-3 py-2 rounded-lg bg-blue-50/40 border border-blue-200/70 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-blue-700 font-medium">To Be Utilised Spend</div>
              <div className="text-sm font-bold text-blue-900 mt-0.5">{fmt(cost)}</div>
            </div>
            <span className="text-[10px] text-blue-600 font-medium">− Spend</span>
          </div>

          {/* Card 3: Post-launch remaining */}
          <div className="px-3 py-2 rounded-lg bg-emerald-50/40 border border-emerald-200/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-medium">Remaining Post-Launch</div>
              <div className="text-sm font-bold text-emerald-900 mt-0.5">{fmt(remaining)}</div>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">= Balance</span>
          </div>
        </div>

        {/* Slim, Subtle Graphical Progress Bar */}
        <div className="flex flex-col gap-1.5 pt-0.5">
          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden flex">
            <div 
              className="bg-blue-600 h-full transition-all duration-500 rounded-l-full" 
              style={{ width: `${Math.max(1, pctBlocked)}%` }}
              title={`To be utilised spend: ${fmt(cost)}`}
            />
            <div 
              className="bg-emerald-500 h-full transition-all duration-500 rounded-r-full" 
              style={{ width: `${pctRemaining}%` }}
              title={`Remaining: ${fmt(remaining)}`}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-neutral-400">
            <span className="flex items-center gap-1 text-blue-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
              To be utilised: {fmt(cost)} ({pctBlocked}%)
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Remaining: {fmt(remaining)} ({pctRemaining}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const buildConsent = (kind: BuilderKind): CampaignConsent => ({
  acknowledgedAt: new Date().toISOString(),
  items: getAcknowledgements(kind),
});

/* ---------- Small form atoms ---------- */

export const FieldLabel: React.FC<{ htmlFor?: string; hint?: string; children: React.ReactNode; required?: boolean }> = ({ htmlFor, hint, children, required }) => (
  <label htmlFor={htmlFor} className="text-xs font-semibold text-neutral-800 flex items-center justify-between">
    <span>
      {children}
      {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
    </span>
    {hint && <span className="font-normal text-[11px] text-neutral-400 not-italic">{hint}</span>}
  </label>
);

export const inputCls = (bad?: boolean) =>
  `h-10 w-full rounded-lg border bg-white px-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:bg-neutral-50 disabled:text-neutral-400 ${
    bad ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500' : 'border-neutral-200'
  }`;

export const Chip: React.FC<{ on?: boolean; onClick?: () => void; disabled?: boolean; children: React.ReactNode }> = ({ on, onClick, disabled, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={!!on}
    className={`inline-flex h-8 sm:h-9 items-center px-3.5 text-xs font-medium rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
      on 
        ? 'border-neutral-900 bg-neutral-900 text-white font-semibold shadow-xs' 
        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300'
    }`}
  >
    {children}
  </button>
);
