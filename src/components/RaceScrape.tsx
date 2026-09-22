import React, { useState, useEffect } from 'react';
import {
  Loader2, AlertTriangle, Download, Info, CheckCircle2, HelpCircle, XCircle, Play,
} from 'lucide-react';
import { raceFetch } from './raceApi';

/**
 * Step 3 — run the reviewed plan.
 *
 * Two things this screen is careful about.
 *
 * You pick which actors run before spending, because one of them is flagged as
 * contested and you may not want to pay to rediscover that.
 *
 * A zero-item result is shown as SUSPECT, not as empty, with the sentence that
 * explains which it probably is. "No items" and "no footprint" are different
 * claims and the difference is the whole value of the step.
 */

type PlanReady = {
  platform: string; label: string; actor: string;
  status: 'verified' | 'unverified' | 'unproven-contested';
  input: Record<string, unknown>; note?: string;
};

type Attempt = {
  platform: string; label: string; actor: string;
  planStatus: PlanReady['status'];
  outcome: 'succeeded' | 'zero_item_suspect' | 'failed' | 'skipped';
  itemCount: number; costUSD?: number; durationMs?: number;
  narrative: string; error?: string;
};

export type Scrape = {
  subjectId: string; status: string;
  attempts: Attempt[];
  report: { attempted: number; succeeded: number; zeroItem: number; failed: number;
            skipped: number; totalItems: number; totalCostUSD: number };
  steps: { t: string; level: 'info' | 'warn' | 'error'; msg: string }[];
  data: Record<string, unknown[]>;
  storedIn?: string;
};

const OUTCOME = {
  succeeded: { icon: CheckCircle2, cls: 'text-emerald-600', label: 'returned items' },
  zero_item_suspect: { icon: HelpCircle, cls: 'text-amber-600', label: 'zero items — suspect' },
  failed: { icon: XCircle, cls: 'text-red-500', label: 'failed' },
  skipped: { icon: Info, cls: 'text-neutral-400', label: 'skipped' },
} as const;

export const RaceScrape: React.FC<{
  subjectId: string;
  ready: PlanReady[];
  enabled: boolean;
  initialScrape?: Scrape | null;
  onComplete?: (s: Scrape) => void;
}> = ({ subjectId, ready, enabled, initialScrape, onComplete }) => {
  const [scrape, setScrape] = useState<Scrape | null>(initialScrape ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>(ready.map((r) => r.platform));
  const [tab, setTab] = useState<string>('report');

  useEffect(() => {
    setScrape(initialScrape ?? null);
    setPicked(ready.map((r) => r.platform));
  }, [initialScrape, subjectId, ready.length]);

  const toggle = (platform: string) =>
    setPicked((p) => (p.includes(platform) ? p.filter((x) => x !== platform) : [...p, platform]));

  const run = async () => {
    setBusy(true); setError(null); setHint(null); setScrape(null);
    const res = await raceFetch<Scrape>(`/api/race/subjects/${subjectId}/scrape`,
                                        { method: 'POST', body: { only: picked } });
    setBusy(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? 'request failed'); setHint(res.hint ?? null); return;
    }
    setScrape(res.data); setTab('report'); onComplete?.(res.data);
  };

  return (
    <div className="space-y-2.5 pt-3 border-t border-neutral-100">
      {/* Pick what runs, before anything is spent. */}
      {enabled && !scrape && ready.length > 0 && (
        <div className="border border-neutral-200 rounded-lg p-2.5 space-y-1.5 bg-neutral-50/60">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Actors to run
          </div>
          {ready.map((r) => (
            <label key={r.platform} className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={picked.includes(r.platform)}
                     onChange={() => toggle(r.platform)} disabled={busy}
                     className="mt-0.5 accent-neutral-900" />
              <span className="text-[10.5px]">
                <span className="font-bold text-neutral-800">{r.label}</span>
                <span className="text-neutral-400 font-mono ml-1.5">{r.actor}</span>
                {r.status !== 'verified' && (
                  <span className="ml-1.5 text-amber-700">{r.status}</span>
                )}
              </span>
            </label>
          ))}
          <p className="text-[9.5px] text-neutral-400 pt-0.5">
            Apify bills per result row, so the cost is only known once a run finishes.
          </p>
        </div>
      )}

      <button
        type="button" onClick={run} disabled={!enabled || busy || picked.length === 0}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
          !enabled || busy || picked.length === 0
            ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
            : 'bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50 cursor-pointer active:scale-99'}`}
        id="race_step3_btn"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
        <span>
          {busy ? 'Running actors — this takes minutes…'
                : `Fetch Profile Data — Step 3${picked.length ? ` (${picked.length})` : ''}`}
        </span>
      </button>
      {!enabled && (
        <p className="text-[10px] text-neutral-400 text-center">
          Complete step 2 first — step 3 runs the plan it produced.
        </p>
      )}

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle size={12} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <div className="text-[11px] text-red-700 font-medium">{error}</div>
            {hint && <div className="text-[10px] text-red-600 mt-0.5">{hint}</div>}
          </div>
        </div>
      )}

      {scrape && (
        <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
          <div className="px-3 py-2 bg-neutral-50 border-b border-neutral-100">
            <div className="text-[11px] font-bold text-neutral-800">
              Profile data fetched for {scrape.subjectId}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">
              {scrape.report.succeeded}/{scrape.report.attempted} returned items ·{' '}
              {scrape.report.totalItems} rows · ${scrape.report.totalCostUSD.toFixed(4)}
              {scrape.storedIn && ` · saved to ${scrape.storedIn}`}
            </div>
          </div>

          <div className="flex items-center gap-1 px-2 pt-2 border-b border-neutral-100 overflow-x-auto">
            <button type="button" onClick={() => setTab('report')}
              className={`px-2.5 py-1.5 text-[10.5px] font-bold rounded-t-md whitespace-nowrap ${
                tab === 'report' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'}`}>
              Report
            </button>
            {scrape.attempts.map((a) => (
              <button key={a.platform} type="button" onClick={() => setTab(a.platform)}
                className={`px-2.5 py-1.5 text-[10.5px] font-bold rounded-t-md whitespace-nowrap ${
                  tab === a.platform ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'}`}>
                {a.label} <span className="text-neutral-400">{a.itemCount}</span>
              </button>
            ))}
            <a href={`/api/race/subjects/${scrape.subjectId}/scrape`} target="_blank" rel="noreferrer"
               className="ml-auto flex items-center gap-1 px-2 py-1 text-[10px] text-neutral-400 hover:text-neutral-900">
              <Download size={11} /> JSON
            </a>
          </div>

          <div className="max-h-72 overflow-auto p-2.5 text-[10.5px]">
            {tab === 'report' && scrape.attempts.map((a) => {
              const O = OUTCOME[a.outcome];
              const Icon = O.icon;
              return (
                <div key={a.platform} className="flex items-start gap-2 py-1">
                  <Icon size={13} className={`${O.cls} mt-0.5 shrink-0`} />
                  <div>
                    <div className="font-bold text-neutral-800">
                      {a.label}
                      <span className="text-neutral-400 font-normal ml-1.5">
                        {a.itemCount} item(s)
                        {a.durationMs ? ` · ${Math.round(a.durationMs / 1000)}s` : ''}
                        {a.costUSD != null ? ` · $${a.costUSD.toFixed(4)}` : ''}
                      </span>
                    </div>
                    <div className="text-neutral-500">{a.narrative}</div>
                  </div>
                </div>
              );
            })}

            {tab !== 'report' && (
              <pre className="text-[10px] text-neutral-700 whitespace-pre-wrap break-all">
{JSON.stringify((scrape.data ?? {})[tab] ?? [], null, 2).slice(0, 20000)}
              </pre>
            )}
          </div>

          {scrape.report.zeroItem > 0 && (
            <div className="flex items-start gap-1.5 px-3 py-2 bg-amber-50 border-t border-amber-100">
              <HelpCircle size={11} className="text-amber-600 shrink-0 mt-0.5" />
              <span className="text-[10px] text-amber-800">
                {scrape.report.zeroItem} actor(s) returned nothing. Zero items and an
                empty account look identical — check the Report tab before reading
                any of these as absence.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
