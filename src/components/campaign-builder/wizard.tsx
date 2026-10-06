import React from 'react';

/* Shared building blocks for the 4-step campaign builders
   (Lead Gen, Lead Qualification, Customer Insight). Minimal, Apple-like. */

export type BuilderKind = 'leadgen' | 'qualification' | 'insight';

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
  <>
    <div className="flex items-center justify-between text-[13px] text-[#6e6e73]">
      <div>
        <button type="button" onClick={onCancel} className="hover:text-[#1d1d1f] transition-colors">{section}</button>
        <span className="mx-2">·</span>
        <span>Campaign builder</span>
      </div>
      <button type="button" onClick={onCancel} className="hover:text-[#1d1d1f] transition-colors">Cancel</button>
    </div>
    <div>
      <h2 className="text-[34px] leading-[1.1] font-semibold tracking-[-0.02em] text-[#1d1d1f]">{title}</h2>
      <p className="mt-1 text-base text-[#6e6e73]">{subtitle}</p>
    </div>
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-[#6e6e73]">
      <span>{client.name}</span><Dot /><span>{client.industry}</span><Dot />
      <span>Ticket size {formatTicket(client.ticketSize)}</span><Dot /><span>{client.purchaseChannel}</span>
      <span className="ml-1 rounded-[10px] bg-[#f0f0f3] px-2.5 py-[3px] text-xs font-medium">Managed in Client Onboarding</span>
    </div>
    <div className="grid grid-cols-4 gap-3" role="list" aria-label="Progress">
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
            className={`text-left border-t-[3px] pt-2.5 text-[13px] ${
              on ? 'border-[#0071e3] text-[#0071e3]' : done ? 'border-[#1d1d1f] text-[#6e6e73]' : 'border-[#d2d2d7] text-[#86868b]'
            } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
          >
            Step {n}
            <span className={`block mt-0.5 text-[15px] font-semibold ${on || done ? 'text-[#1d1d1f]' : 'text-[#86868b]'}`}>{label}</span>
          </button>
        );
      })}
    </div>
  </>
);

const Dot = () => <i className="inline-block h-[3px] w-[3px] rounded-full bg-[#aeaeb2]" />;

/* ---------- Card + footer ---------- */

export const WizardCard: React.FC<{ title?: string; lead?: string; children: React.ReactNode }> = ({ title, lead, children }) => (
  <div className="flex flex-col gap-7 rounded-[20px] bg-white p-9 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
    {title && (
      <div className="space-y-1.5">
        <h3 className="text-[22px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">{title}</h3>
        {lead && <p className="max-w-[640px] text-[15px] leading-relaxed text-[#6e6e73]">{lead}</p>}
      </div>
    )}
    {children}
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
  <div className="mt-2 flex items-center justify-between">
    <div>
      {onDraft ? (
        <button type="button" onClick={onDraft} className="px-2 text-base font-medium text-[#0071e3] hover:opacity-80">Save as draft</button>
      ) : (
        <button type="button" onClick={onBack} className="px-2 text-base font-medium text-[#0071e3] hover:opacity-80">{backLabel ?? (step === 1 ? 'Cancel' : 'Back')}</button>
      )}
    </div>
    <div className="flex items-center gap-3">
      <span className="text-[13px] text-[#6e6e73]">{progressNote ?? `Step ${step} of ${total}`}</span>
      {onDraft && (
        <button type="button" onClick={onBack} className="h-12 rounded-full bg-[#e8e8ed] px-7 text-base font-medium text-[#1d1d1f]">Back</button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="h-12 rounded-full bg-[#0071e3] px-7 text-base font-medium text-white transition-colors hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:bg-[#b9d7f7]"
      >
        {nextLabel}
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
    <WizardCard title="Share your top 5 customer emails" lead={lead}>
      <div className="flex max-w-[640px] flex-col gap-3.5">
        {Array.from({ length: REQUIRED_EMAILS }).map((_, i) => {
          const v = emails[i] ?? '';
          const t = v.trim();
          const valid = t !== '' && isValidEmail(t);
          const dup = valid && lower.indexOf(t.toLowerCase()) !== i;
          const bad = t !== '' && (!valid || dup);
          return (
            <div key={i}>
              <div className="flex items-center gap-3.5">
                <span className={`flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-[13px] font-semibold ${valid && !dup ? 'bg-[#1d1d1f] text-white' : 'bg-[#f0f0f3] text-[#6e6e73]'}`}>{i + 1}</span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  aria-label={`Email ${i + 1}`}
                  aria-invalid={bad}
                  placeholder="name@company.com"
                  value={v}
                  onChange={(e) => {
                    const next = [...emails];
                    while (next.length < REQUIRED_EMAILS) next.push('');
                    next[i] = e.target.value;
                    onChange(next);
                  }}
                  className={`h-12 w-full rounded-xl border bg-white px-4 text-base text-[#1d1d1f] outline-none focus:border-[#0071e3] ${bad ? 'border-[#d70015]' : 'border-[#d2d2d7]'}`}
                />
              </div>
              {bad && <p className="ml-11 mt-1 text-[13px] text-[#d70015]">{dup ? 'This email is already listed.' : 'Enter a valid email address.'}</p>}
            </div>
          );
        })}
      </div>
      <div className="max-w-[640px] rounded-[14px] bg-[#f5f5f7] px-[18px] py-4 text-sm leading-relaxed text-[#3a3a3c]">
        Used only to improve matching for this campaign. They are {noteTail} or shared with anyone else.
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
    { id: 'emails', text: 'I understand the top 5 emails are used only to improve matching accuracy for this campaign.' },
    { id: 'optout', text: 'I will respect opt-out and Do-Not-Disturb requests, and can share consent records if asked.' },
  ];
};

export const ReviewConsentStep: React.FC<{
  kind: BuilderKind;
  sections: SummarySection[];
  acks: boolean[];
  onToggle: (i: number) => void;
  actionWord: string; // "launch" | "run"
}> = ({ kind, sections, acks, onToggle, actionWord }) => {
  const items = getAcknowledgements(kind);
  const count = acks.filter(Boolean).length;
  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <WizardCard title="Review">
        <div className="-mt-3 flex flex-col">
          {sections.map((s, si) => (
            <div key={s.heading} className={si > 0 ? 'mt-5' : ''}>
              <h4 className="mb-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#6e6e73]">{s.heading}</h4>
              {s.rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 border-b border-[#f0f0f3] py-[13px] text-[15px] last:border-b-0">
                  <span className="text-[#6e6e73]">{k}</span>
                  <b className="text-right font-medium text-[#1d1d1f]">{v}</b>
                </div>
              ))}
            </div>
          ))}
        </div>
      </WizardCard>
      <WizardCard title={`Before you ${actionWord}`} lead="A quick confirmation, so everyone is comfortable. Please tick all four.">
        <div className="-mt-2 flex flex-col gap-3">
          {items.map((it, i) => (
            <div key={it.id} className={`flex items-start gap-3.5 rounded-[14px] border px-5 py-[18px] ${acks[i] ? 'border-[#bcd7f7] bg-[#f5f9ff]' : 'border-[#e5e5ea] bg-white'}`}>
              <input id={`ack-${it.id}`} type="checkbox" checked={!!acks[i]} onChange={() => onToggle(i)} className="mt-px h-[22px] w-[22px] flex-none accent-[#0071e3]" />
              <label htmlFor={`ack-${it.id}`} className="cursor-pointer text-[15px] leading-normal text-[#1d1d1f]">{it.text}</label>
            </div>
          ))}
        </div>
        <span className="-mt-2 text-[13px] text-[#6e6e73]" aria-live="polite">
          {count} of 4 confirmed.{count < 4 ? ` ${actionWord === 'run' ? 'Running' : 'Launch'} becomes available once all four are ticked.` : ''}
        </span>
      </WizardCard>
    </div>
  );
};

export const buildConsent = (kind: BuilderKind): CampaignConsent => ({
  acknowledgedAt: new Date().toISOString(),
  items: getAcknowledgements(kind),
});

/* ---------- Small form atoms ---------- */

export const FieldLabel: React.FC<{ htmlFor?: string; hint?: string; children: React.ReactNode; required?: boolean }> = ({ htmlFor, hint, children, required }) => (
  <label htmlFor={htmlFor} className="text-sm font-semibold text-[#1d1d1f]">
    {children}
    {hint && <em className="ml-1.5 font-normal not-italic text-[#6e6e73]">{hint}</em>}
    {required && <em className="ml-1.5 font-normal not-italic text-[#6e6e73]">Required</em>}
  </label>
);

export const inputCls = (bad?: boolean) =>
  `h-12 w-full rounded-xl border bg-white px-4 text-base text-[#1d1d1f] outline-none focus:border-[#0071e3] disabled:bg-[#f5f5f7] disabled:text-[#86868b] ${bad ? 'border-[#d70015]' : 'border-[#d2d2d7]'}`;

export const Chip: React.FC<{ on?: boolean; onClick?: () => void; disabled?: boolean; children: React.ReactNode }> = ({ on, onClick, disabled, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={!!on}
    className={`inline-flex h-10 items-center rounded-full border px-[18px] text-[15px] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${on ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white' : 'border-[#d2d2d7] bg-white text-[#1d1d1f] hover:border-[#86868b]'}`}
  >
    {children}
  </button>
);
