import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, CheckCircle2, Database, HardDrive, Download } from 'lucide-react';

/**
 * Live identity resolution — the real pipeline.
 *
 * Split into a headless hook and a display panel so the form that owns the
 * email field can also own the button. The Internal Insight screen already has
 * sector, ticket price and a contact email; it should not need a second form
 * bolted underneath it to run them.
 *
 * The panel shows the fetch. It is NOT the RACE intake record — no tiering, no
 * confidence bands, no dormancy detection. Those come from the skill, later.
 */

export type Step = { t: string; level: 'info' | 'warn' | 'error'; msg: string };
export type Account = { platform: string; vendor: string; detail?: string };
export type Views = {
  registered: { module: string; category?: string; categoryDescription?: string }[];
  rich: { module: string; fields: Record<string, any>; specialCategoryFields: string[] }[];
  breached: { module: string; title?: string; website?: string; breachDate?: string;
              breachCount?: number; dataClasses: string[]; description?: string }[];
  timeline: { module: string; group: string; start: string; content: string }[];
  geo: { module: string; latitude: number; longitude: number; label?: string }[];
  counts: { modules: number; registered: number; rich: number;
            breached: number; timelineEvents: number; geo: number };
};

export type Run = {
  runId: string; subjectId: string; status: string; costINR: number;
  vendorsCalled: { vendor: string; ok: boolean; itemCount?: number; error?: string }[];
  steps: Step[];
  summary?: { accounts: Account[]; platformCount: number; breachSources: string[] };
  views?: Views;
  error?: string;
};

const headers = (): Record<string, string> => {
  const token = sessionStorage.getItem('race_token') ?? '';
  return { 'Content-Type': 'application/json', ...(token ? { 'x-race-token': token } : {}) };
};

export function useRaceRun() {
  const [run, setRun] = useState<Run | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storage, setStorage] = useState<{ backend: string } | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    fetch('/api/race/status', { headers: headers() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.storage && setStorage(d.storage))
      .catch(() => { /* the badge is a nicety, not a blocker */ });
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, []);

  const start = useCallback(async (opts: {
    email: string; sector?: string; ticketBand?: string; useCase?: string;
  }) => {
    setError(null); setRun(null); setBusy(true);
    try {
      const res = await fetch('/api/race/run', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({
          email: opts.email.trim(),
          useCase: opts.useCase ?? 'customer_insight',
          sector: opts.sector,
          ticketBand: opts.ticketBand,
          consentBasis: 'Opt-in: internal employee, consent on file',
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? `HTTP ${res.status}`); setBusy(false); return; }

      setRun({ runId: data.runId, subjectId: data.subjectId, status: 'running',
               costINR: 0, vendorsCalled: [], steps: [] });

      // The run outlives the request — poll the record until it settles.
      timer.current = window.setInterval(async () => {
        try {
          const r = await fetch(`/api/race/runs/${data.runId}`, { headers: headers() });
          if (!r.ok) return;
          const rec: Run = await r.json();
          setRun(rec);
          if (rec.status !== 'running') {
            if (timer.current) window.clearInterval(timer.current);
            setBusy(false);
          }
        } catch { /* a dropped poll is not a failed run */ }
      }, 2000);
    } catch (e: any) {
      setError(e?.message ?? 'request failed'); setBusy(false);
    }
  }, []);

  return { run, busy, error, storage, start };
}

export const StorageBadge: React.FC<{ storage: { backend: string } | null }> = ({ storage }) =>
  storage ? (
    <span className="flex items-center gap-1 text-[10px] text-neutral-400 font-medium">
      {storage.backend === 'firestore'
        ? <><Database size={11} /> Firestore</>
        : <><HardDrive size={11} /> local disk</>}
    </span>
  ) : null;

export const RaceRunPanel: React.FC<{
  run: Run | null; error: string | null; email: string; storage: { backend: string } | null;
}> = ({ run, error, email, storage }) => {
  const dot = (l: Step['level']) =>
    l === 'error' ? 'bg-red-500' : l === 'warn' ? 'bg-amber-500' : 'bg-neutral-300';
  const done = run?.status === 'completed';

  if (!run && !error) return null;

  return (
    <div className="space-y-2.5 pt-3">
      {error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle size={12} className="text-red-500 mt-0.5 shrink-0" />
          <span className="text-[11px] text-red-700 font-medium">{error}</span>
        </div>
      )}

      {run && run.steps.length > 0 && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 max-h-40 overflow-y-auto space-y-1">
          {run.steps.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-[10.5px]">
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dot(s.level)}`} />
              <span className="text-neutral-400 font-mono shrink-0">{s.t.slice(11, 19)}</span>
              <span className="text-neutral-700">{s.msg}</span>
            </div>
          ))}
        </div>
      )}

      {done && !run?.error && (
        <div className="px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
            <span className="text-[11px] font-bold text-emerald-900">
              Data fetched and stored successfully against {run!.subjectId}
            </span>
          </div>
          <p className="text-[10px] text-emerald-800 pl-5 font-medium">
            {email} · {run!.views?.counts.modules ?? run!.summary?.platformCount ?? 0} modules
            {run!.views ? ` · ${run!.views.counts.rich} detailed · ${run!.views.counts.breached} breaches` : ''}
            {' '}· ₹{run!.costINR.toFixed(2)}
            {storage?.backend === 'firestore' ? ' · saved to Firestore' : ' · saved to disk'}
          </p>
        </div>
      )}

      {done && run?.views && <ViewTabs views={run.views} runId={run.runId} />}

      {run?.status === 'failed' && (
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
          <span className="text-[11px] text-amber-800 font-medium">{run.error ?? 'run failed'}</span>
        </div>
      )}
    </div>
  );
};

const TABS: { key: keyof Views; label: string; countKey: keyof Views['counts'] }[] = [
  { key: 'rich', label: 'Detail', countKey: 'rich' },
  { key: 'registered', label: 'Registered', countKey: 'registered' },
  { key: 'breached', label: 'Breaches', countKey: 'breached' },
  { key: 'timeline', label: 'Timeline', countKey: 'timelineEvents' },
  { key: 'geo', label: 'Locations', countKey: 'geo' },
];

const CSV_FOR: Record<string, string> = {
  rich: 'rich_data.csv', registered: 'checker_registered_data.csv',
  breached: 'breached_data.csv', timeline: 'timeline_events.csv', geo: 'geo_data.csv',
};

export const ViewTabs: React.FC<{ views: Views; runId: string }> = ({ views, runId }) => {
  const available = TABS.filter((t) => (views.counts as any)[t.countKey] > 0);
  const [tab, setTab] = useState<keyof Views>(available[0]?.key ?? 'rich');
  if (!available.length) return null;

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center gap-1 px-2 pt-2 border-b border-neutral-100 overflow-x-auto">
        {available.map((t) => (
          <button key={String(t.key)} type="button" onClick={() => setTab(t.key)}
            className={`px-2.5 py-1.5 text-[10.5px] font-bold rounded-t-md whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'}`}>
            {t.label} <span className="text-neutral-400">{(views.counts as any)[t.countKey]}</span>
          </button>
        ))}
        <a href={`/api/race/runs/${runId}/csv/${CSV_FOR[String(tab)]}`}
           className="ml-auto flex items-center gap-1 px-2 py-1 text-[10px] text-neutral-400 hover:text-neutral-900">
          <Download size={11} /> CSV
        </a>
      </div>

      <div className="max-h-72 overflow-auto p-2.5 text-[10.5px]">
        {tab === 'rich' && views.rich.map((r) => (
          <div key={r.module} className="mb-2.5 last:mb-0">
            <div className="font-bold text-neutral-800 mb-0.5">
              {r.module}
              {r.specialCategoryFields.length > 0 && (
                <span className="ml-1.5 px-1 py-0.5 bg-amber-50 border border-amber-200 rounded text-[9px] font-medium text-amber-700">
                  special category: {r.specialCategoryFields.join(', ')}
                </span>
              )}
            </div>
            <div className="grid grid-cols-[minmax(90px,auto)_1fr] gap-x-3 gap-y-0.5">
              {Object.entries(r.fields).map(([k, v]) => (
                <React.Fragment key={k}>
                  <span className="text-neutral-400 font-mono">{k}</span>
                  <span className="text-neutral-700 break-all">{String(v)}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}

        {tab === 'registered' && (
          <div className="flex flex-wrap gap-1">
            {views.registered.map((r) => (
              <span key={r.module} className="px-1.5 py-0.5 bg-neutral-50 border border-neutral-200 rounded text-neutral-700">
                {r.module}{r.category && <span className="text-neutral-400"> · {r.category}</span>}
              </span>
            ))}
          </div>
        )}

        {tab === 'breached' && views.breached.map((b) => (
          <div key={b.module} className="mb-2 last:mb-0 pb-2 border-b border-neutral-100 last:border-0">
            <div className="font-bold text-neutral-800">
              {b.title ?? b.module}
              {b.breachDate && <span className="text-neutral-400 font-normal"> · {b.breachDate.slice(0, 10)}</span>}
            </div>
            {b.breachCount != null && (
              <div className="text-neutral-500">{b.breachCount.toLocaleString()} accounts</div>
            )}
            {b.dataClasses.length > 0 && (
              <div className="text-neutral-500 mt-0.5">Exposed: {b.dataClasses.join(', ')}</div>
            )}
          </div>
        ))}

        {tab === 'timeline' && views.timeline.map((t, i) => (
          <div key={i} className="flex items-baseline gap-2 py-0.5">
            <span className="text-neutral-400 font-mono shrink-0">{t.start.slice(0, 10)}</span>
            <span className="font-bold text-neutral-700 shrink-0">{t.module}</span>
            <span className="text-neutral-500">{t.content}</span>
          </div>
        ))}

        {tab === 'geo' && views.geo.map((g, i) => (
          <div key={i} className="py-0.5">
            <span className="font-bold text-neutral-700">{g.module}</span>
            <span className="text-neutral-500 font-mono ml-2">{g.latitude}, {g.longitude}</span>
            {g.label && <span className="text-neutral-400 ml-2">{g.label}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export const RunSpinner: React.FC = () => <Loader2 size={13} className="animate-spin" />;
