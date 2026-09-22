import React, { useState } from 'react';
import { Loader2, AlertTriangle, Crosshair, Download, Info } from 'lucide-react';

/**
 * Step 2 — the scrape-target plan.
 *
 * Shows what COULD be scraped and what could not, with a reason on every line.
 * Nothing here calls an actor or spends anything; the footer says so, because a
 * screen full of actor names and inputs otherwise looks like something already
 * ran.
 */

type Ready = {
  platform: string; label: string; actor: string;
  status: 'verified' | 'unverified' | 'unproven-contested';
  note?: string; input: Record<string, unknown>;
  from: { kind: string; value: string; module: string }[];
};
type Blocked = { platform: string; label: string; actor: string; needs: string; why: string };
type NoRoute = { platform: string; reason: string; detail: string; identifiersHeld: number };
type Identifier = { platform: string; module: string; kind: string; value: string; provenance: string };

export type Plan = {
  subjectId: string; sourceRunId: string; createdAt: string;
  identifiers: Identifier[]; ready: Ready[]; blocked: Blocked[]; noRoute: NoRoute[];
  counts: { identifiers: number; ready: number; blocked: number; noRoute: number };
};

const STATUS_STYLE: Record<Ready['status'], string> = {
  verified: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  unverified: 'bg-neutral-100 border-neutral-200 text-neutral-500',
  'unproven-contested': 'bg-amber-50 border-amber-200 text-amber-700',
};

export const RaceTargets: React.FC<{ subjectId: string; enabled: boolean }> = ({
  subjectId, enabled,
}) => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'ready' | 'blocked' | 'noRoute' | 'identifiers'>('ready');

  const headers = (): Record<string, string> => {
    const token = sessionStorage.getItem('race_token') ?? '';
    return { 'Content-Type': 'application/json', ...(token ? { 'x-race-token': token } : {}) };
  };

  const run = async () => {
    setBusy(true); setError(null); setPlan(null);
    try {
      const res = await fetch(`/api/race/subjects/${subjectId}/targets`,
                              { method: 'POST', headers: headers() });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? `HTTP ${res.status}`); return; }
      setPlan(data); setTab('ready');
    } catch (e: any) {
      setError(e?.message ?? 'request failed');
    } finally {
      setBusy(false);
    }
  };

  const TABS = plan ? ([
    ['ready', 'Ready', plan.counts.ready],
    ['blocked', 'Blocked', plan.counts.blocked],
    ['noRoute', 'No route', plan.counts.noRoute],
    ['identifiers', 'Identifiers', plan.counts.identifiers],
  ] as const) : [];

  return (
    <div className="space-y-2.5 pt-3 border-t border-neutral-100">
      <button
        type="button" onClick={run} disabled={!enabled || busy}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
          !enabled || busy
            ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
            : 'bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50 cursor-pointer active:scale-99'}`}
        id="race_step2_btn"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Crosshair size={13} />}
        <span>{busy ? 'Identifying targets…' : 'Run Step 2 — Identify scrape targets'}</span>
      </button>
      {!enabled && (
        <p className="text-[10px] text-neutral-400 text-center">
          Complete step 1 for this subject first.
        </p>
      )}

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle size={12} className="text-red-500 mt-0.5 shrink-0" />
          <span className="text-[11px] text-red-700 font-medium">{error}</span>
        </div>
      )}

      {plan && (
        <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
          <div className="px-3 py-2 bg-neutral-50 border-b border-neutral-100">
            <div className="text-[11px] font-bold text-neutral-800">
              Scrape targets identified for {plan.subjectId}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">
              {plan.counts.identifiers} identifiers · {plan.counts.ready} actors ready ·{' '}
              {plan.counts.blocked} blocked · {plan.counts.noRoute} no route
            </div>
          </div>

          <div className="flex items-center gap-1 px-2 pt-2 border-b border-neutral-100 overflow-x-auto">
            {TABS.map(([key, label, count]) => (
              <button key={key} type="button" onClick={() => setTab(key)}
                className={`px-2.5 py-1.5 text-[10.5px] font-bold rounded-t-md whitespace-nowrap transition-colors ${
                  tab === key ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'}`}>
                {label} <span className="text-neutral-400">{count}</span>
              </button>
            ))}
            <a href={`/api/race/subjects/${plan.subjectId}/targets`} target="_blank" rel="noreferrer"
               className="ml-auto flex items-center gap-1 px-2 py-1 text-[10px] text-neutral-400 hover:text-neutral-900">
              <Download size={11} /> JSON
            </a>
          </div>

          <div className="max-h-72 overflow-auto p-2.5 text-[10.5px]">
            {tab === 'ready' && plan.ready.map((r) => (
              <div key={r.platform} className="mb-3 last:mb-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-neutral-800">{r.label}</span>
                  <span className="font-mono text-neutral-400">{r.actor}</span>
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-medium ${STATUS_STYLE[r.status]}`}>
                    {r.status}
                  </span>
                </div>
                <pre className="mt-1 px-2 py-1.5 bg-neutral-50 border border-neutral-100 rounded text-[10px] text-neutral-700 overflow-x-auto">
{JSON.stringify(r.input)}
                </pre>
                <div className="text-neutral-400 mt-0.5">
                  from {r.from.map((f) => `${f.kind} · module "${f.module}"`).join('; ')}
                </div>
                {r.note && <div className="text-amber-700 mt-0.5">{r.note}</div>}
              </div>
            ))}

            {tab === 'blocked' && plan.blocked.map((b) => (
              <div key={b.platform} className="flex items-baseline gap-2 py-0.5">
                <span className="font-bold text-neutral-700 shrink-0 w-28">{b.label}</span>
                <span className="text-neutral-500">{b.why}</span>
              </div>
            ))}

            {tab === 'noRoute' && plan.noRoute.map((n) => (
              <div key={n.platform} className="flex items-baseline gap-2 py-0.5">
                <span className="font-bold text-neutral-700 shrink-0 w-28">{n.platform}</span>
                <span className="text-neutral-400 shrink-0">{n.reason}</span>
                <span className="text-neutral-500">{n.detail}</span>
              </div>
            ))}

            {tab === 'identifiers' && plan.identifiers.map((i, idx) => (
              <div key={idx} className="grid grid-cols-[6rem_6rem_1fr_auto] gap-2 py-0.5 items-baseline">
                <span className="font-bold text-neutral-700 truncate">{i.module}</span>
                <span className="text-neutral-400 font-mono">{i.kind}</span>
                <span className="text-neutral-700 break-all">{i.value}</span>
                <span className="text-neutral-300 text-[9px]">{i.provenance}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 bg-neutral-50 border-t border-neutral-100">
            <Info size={11} className="text-neutral-400 shrink-0" />
            <span className="text-[10px] text-neutral-500">
              Plan only — nothing has been called and nothing spent.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
