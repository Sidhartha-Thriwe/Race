import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertTriangle, Download, ListOrdered, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { raceFetch } from './raceApi';

/**
 * Step 5 — the ranked categories.
 *
 * Two deliberate choices in this panel.
 *
 * The ranked categories are the headline and the deprioritised ones sit behind a
 * toggle — but they are on the same screen, not a different one. The skill is
 * explicit that rejected rows are retained and marked rather than deleted,
 * because a bank reviewer wants to see that dining was considered and why it
 * lost. Hiding them by default keeps the demo readable; removing them would
 * remove the argument.
 *
 * And nothing here names a brand, a product or a mechanism. High-end fitness is
 * a category; a named race series is an offer. The engine stops at the first,
 * the server strips the second if a model emits it anyway, and this panel has no
 * field to render one into.
 */

type ScoringRow = {
  category: string; revealed: string; psychFit: string; timing: string;
  motivator: string; confidence: string;
  outcome: 'ranked' | 'deprioritised';
  rejected?: boolean; rejectionRule?: string; dispositionNote?: string;
};

type TopCategory = {
  rank: number; category: string; evidenceStrength: number; psychFit: number;
  rationale: string; frameworkArgument?: string; monetisableHeadroom?: string;
  limitation?: string;
};

export type Categories = {
  subjectId: string; model: string; createdAt: string;
  status?: 'running' | 'completed' | 'failed';
  error?: string;
  scoringNote?: string;
  scoringTable: ScoringRow[];
  topCategories: TopCategory[];
  dormantPaidAffinity?: string;
  openWindow?: string;
  deprioritized: string[];
  evidenceNote?: string;
  audit: {
    candidates: number; ranked: number; deprioritised: number;
    byRejectionRule: Record<string, number>; dormantFound: boolean;
    identityScrubbed: number; offerFieldsRemoved: number;
    priceMentions: number; thinJustifications: number;
  };
  storedIn?: string;
};

const CONF_STYLE: Record<string, string> = {
  High: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  Medium: 'bg-blue-50 border-blue-200 text-blue-700',
  Low: 'bg-amber-50 border-amber-200 text-amber-700',
};

const RULE_LABEL: Record<string, string> = {
  ubiquitous_not_identity: 'Ubiquitous, not identity',
  no_monetisable_headroom: 'No monetisable headroom',
  hygiene_only: 'Hygiene only',
  stale: 'Stale',
  out_of_scope: 'Out of scope',
  unstated: 'No rule stated',
};

export const RaceCategories: React.FC<{
  subjectId: string; enabled: boolean; initialCategories?: Categories | null;
}> = ({ subjectId, enabled, initialCategories }) => {
  const [data, setData] = useState<Categories | null>(initialCategories ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [showRejected, setShowRejected] = useState(false);
  const [open, setOpen] = useState<number | null>(1);

  useEffect(() => { setData(initialCategories ?? null); setError(null); },
            [initialCategories, subjectId]);

  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  /** Start, then poll — the proxy in front of Cloud Run cuts a long response. */
  const run = async () => {
    setBusy(true); setError(null); setHint(null); setData(null);
    const ws = sessionStorage.getItem('anthropic_workspace_id') ?? '';

    const res = await raceFetch<any>(`/api/race/subjects/${subjectId}/categories`, {
      method: 'POST',
      body: ws ? { workspaceId: ws } : {},
    });
    if (!res.ok) {
      setBusy(false);
      setError(res.error ?? 'request failed');
      setHint(res.hint ?? null);
      return;
    }

    timer.current = window.setInterval(async () => {
      const r = await raceFetch<Categories>(`/api/race/subjects/${subjectId}/categories`);
      if (!r.ok || !r.data) return;            // a dropped poll is not a failed run
      if (r.data.status === 'running') return;
      if (timer.current) window.clearInterval(timer.current);
      setBusy(false);
      if (r.data.status === 'failed') setError(r.data.error ?? 'category derivation failed');
      else { setData(r.data); setOpen(1); setShowRejected(false); }
    }, 5000);
  };

  const a = data?.audit;
  const rejectedRows = (data?.scoringTable ?? [])
    .filter((row) => row.outcome === 'deprioritised' || row.rejected);

  return (
    <div className="space-y-2.5">
      <button
        type="button" onClick={run} disabled={!enabled || busy}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
          !enabled || busy
            ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
            : 'bg-[#1e40af] hover:bg-[#1d4ed8] text-white cursor-pointer active:scale-99'}`}
        id="race_step5_btn"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <ListOrdered size={13} />}
        <span>{busy ? 'Scoring categories — this takes 2–3 minutes…' : 'Find Relevant Categories'}</span>
      </button>

      <div className="text-[10px] text-neutral-400 px-1">
        {!enabled
          ? 'Complete step 4 first — step 5 scores against the persona.'
          : 'Step 5 ranks categories only. Offers are a separate step.'}
      </div>

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle size={12} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <div className="text-[11px] text-red-700 font-medium">{error}</div>
            {hint && <div className="text-[10px] text-red-600 mt-0.5">{hint}</div>}
          </div>
        </div>
      )}

      {data && (
        <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
          <div className="px-3 py-2 bg-neutral-50 border-b border-neutral-100">
            <div className="text-[11px] font-bold text-neutral-800">
              Relevant categories — {data.subjectId}
            </div>
            {a && (
              <div className="text-[10px] text-neutral-500 mt-0.5 flex flex-wrap gap-x-3">
                <span>{a.ranked} ranked</span>
                <span>{a.deprioritised} deprioritised</span>
                <span>{a.candidates} candidates scored</span>
                <span className="text-neutral-400">{data.model}</span>
              </div>
            )}
          </div>

          {/* The honesty checks, on screen rather than in the JSON. */}
          {a && (a.thinJustifications > 0 || a.deprioritised === 0 ||
                 a.offerFieldsRemoved > 0 || a.identityScrubbed > 0 ||
                 a.byRejectionRule?.unstated > 0) && (
            <div className="px-3 py-2 bg-amber-50 border-b border-amber-100 space-y-0.5">
              {a.deprioritised === 0 && a.ranked > 0 && (
                <div className="text-[10px] text-amber-800">
                  Nothing was deprioritised — a scoring table with only winners has
                  been curated rather than run.
                </div>
              )}
              {a.thinJustifications > 0 && (
                <div className="text-[10px] text-amber-800">
                  {a.thinJustifications} ranked categor{a.thinJustifications === 1 ? 'y cites' : 'ies cite'} no
                  date, count or platform — those claims cannot be checked.
                </div>
              )}
              {a.byRejectionRule?.unstated > 0 && (
                <div className="text-[10px] text-amber-800">
                  {a.byRejectionRule.unstated} rejected row(s) name no rejection rule.
                </div>
              )}
              {a.offerFieldsRemoved > 0 && (
                <div className="text-[10px] text-amber-800">
                  {a.offerFieldsRemoved} offer-shaped field(s) removed — the model
                  reached past the category into step 6.
                </div>
              )}
              {a.identityScrubbed > 0 && (
                <div className="text-[10px] text-amber-800">
                  {a.identityScrubbed} identity-shaped value(s) removed from the output.
                </div>
              )}
            </div>
          )}

          <div className="max-h-[30rem] overflow-auto text-[10.5px]">
            {data.scoringNote && (
              <div className="px-3 py-2 border-b border-neutral-100 text-neutral-600 leading-snug">
                {data.scoringNote}
              </div>
            )}

            {/* Ranked — the headline. */}
            {data.topCategories.map((c) => {
              const isOpen = open === c.rank;
              return (
                <div key={c.rank} className="border-b border-neutral-100 last:border-0">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.rank)}
                    className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-neutral-50 cursor-pointer"
                  >
                    <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-neutral-900 text-white
                                     text-[10px] font-bold flex items-center justify-center">
                      {c.rank}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="font-bold text-neutral-800">{c.category}</span>
                      <span className="flex items-center gap-2 mt-1 text-[9.5px] text-neutral-400">
                        <Score label="Evidence" value={c.evidenceStrength} />
                        <Score label="Psych fit" value={c.psychFit} />
                      </span>
                    </span>
                    {isOpen ? <ChevronDown size={13} className="text-neutral-400 mt-0.5 shrink-0" />
                            : <ChevronRight size={13} className="text-neutral-400 mt-0.5 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 pl-10 space-y-1.5 text-neutral-600 leading-snug">
                      <Field label="Why this person" text={c.rationale} />
                      <Field label="Why it clears the bar" text={c.frameworkArgument} />
                      <Field label="Monetisable headroom" text={c.monetisableHeadroom} />
                      <Field label="Limitation" text={c.limitation} />
                    </div>
                  )}
                </div>
              );
            })}

            {(data.dormantPaidAffinity || data.openWindow) && (
              <div className="px-3 py-2 border-b border-neutral-100 space-y-1.5">
                <Field label="Dormant paid affinity" text={data.dormantPaidAffinity} />
                <Field label="Open purchase window" text={data.openWindow} />
              </div>
            )}

            {/* Deprioritised — retained, marked, and behind a toggle. */}
            {(rejectedRows.length > 0 || data.deprioritized.length > 0) && (
              <div className="border-b border-neutral-100 last:border-0">
                <button
                  type="button"
                  onClick={() => setShowRejected(!showRejected)}
                  className="w-full flex items-center gap-1.5 px-3 py-2 text-left
                             text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                >
                  {showRejected ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span className="font-bold">
                    {showRejected ? 'Hide' : 'Show'} deprioritised categories
                    {rejectedRows.length ? ` (${rejectedRows.length})` : ''}
                  </span>
                  <span className="ml-auto text-[9.5px] text-neutral-400">
                    considered and rejected, with the reason
                  </span>
                </button>

                {showRejected && (
                  <div className="pb-2">
                    {rejectedRows.map((row, i) => (
                      <div key={i} className="px-3 py-2 mx-3 mb-1.5 rounded-md bg-neutral-50
                                              border border-neutral-100 text-neutral-500">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-bold text-neutral-600">{row.category}</span>
                          {row.rejectionRule && (
                            <span className="px-1.5 py-0.5 rounded border border-neutral-200
                                             bg-white text-[9px] font-medium text-neutral-500">
                              {RULE_LABEL[row.rejectionRule] ?? row.rejectionRule}
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded border text-[9px] font-medium ${
                            CONF_STYLE[row.confidence] ?? CONF_STYLE.Low}`}>
                            {row.confidence}
                          </span>
                        </div>
                        {row.dispositionNote && (
                          <div className="mt-1 leading-snug">{row.dispositionNote}</div>
                        )}
                        <div className="mt-1 text-[9.5px] text-neutral-400 leading-snug">
                          <span className="font-medium">Revealed:</span> {row.revealed}
                          {row.timing ? <> · <span className="font-medium">Timing:</span> {row.timing}</> : null}
                        </div>
                      </div>
                    ))}

                    {data.deprioritized.length > 0 && (
                      <div className="px-3 pt-1 space-y-1.5 text-neutral-500 leading-snug">
                        {data.deprioritized.map((d, i) => <div key={i}>{d}</div>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {data.evidenceNote && (
              <div className="px-3 py-2 text-neutral-500 leading-snug">
                <span className="font-bold text-neutral-600">What the evidence could not reach — </span>
                {data.evidenceNote}
              </div>
            )}
          </div>

          <div className="flex items-start gap-1.5 px-3 py-2 bg-neutral-50 border-t border-neutral-100">
            <Info size={11} className="text-neutral-400 shrink-0 mt-0.5" />
            <span className="text-[10px] text-neutral-500 flex-1">
              Categories only. A category is what the subject is drawn to; the offer
              that serves it is a separate step with its own gates.
              {data.storedIn && ` Saved to ${data.storedIn}.`}
            </span>
            <a href={`/api/race/subjects/${data.subjectId}/categories`} target="_blank" rel="noreferrer"
               className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-900 shrink-0">
              <Download size={11} /> JSON
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; text?: string }> = ({ label, text }) =>
  text ? (
    <div>
      <span className="font-bold text-neutral-500">{label} — </span>
      <span>{text}</span>
    </div>
  ) : null;

const Score: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <span className="flex items-center gap-1">
    <span>{label}</span>
    <span className="w-14 h-1 bg-neutral-100 rounded-full overflow-hidden inline-block align-middle">
      <span className="block h-full bg-neutral-700 rounded-full"
            style={{ width: `${Math.max(0, Math.min(10, Number(value) || 0)) * 10}%` }} />
    </span>
    <span className="font-mono text-neutral-500">{value}</span>
  </span>
);
