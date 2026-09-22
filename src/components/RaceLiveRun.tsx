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

import { raceFetch } from './raceApi';

export type SubjectSummary = {
  subjectId: string; email?: string; lastRunAt?: string; runId?: string;
  modules?: string; costINR?: number;
};

export function useRaceRun() {
  const [run, setRun] = useState<Run | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [storage, setStorage] = useState<{ backend: string } | null>(null);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [estimateINR, setEstimateINR] = useState<number | null>(null);
  const [spentThisMonth, setSpentThisMonth] = useState<number | null>(null);
  /** True when what is on screen came from storage rather than a live call. */
  const [fromStore, setFromStore] = useState(false);
  const timer = useRef<number | null>(null);

  const refreshMeta = useCallback(async () => {
    const st = await raceFetch<any>('/api/race/status');
    if (st.ok && st.data) {
      setStorage(st.data.storage ?? null);
      const configured = (st.data.vendors ?? []).filter((v: any) => v.configured);
      setEstimateINR(configured.reduce((a: number, v: any) => a + (v.costINR ?? 0), 0));
      const month = new Date().toISOString().slice(0, 7);
      const ledger = st.data.ledger ?? {};
      setSpentThisMonth(
        Object.entries(ledger)
          .filter(([k]) => k.startsWith(month))
          .reduce((a, [, v]: any) => a + (v?.spendINR ?? 0), 0),
      );
    }
    const su = await raceFetch<any>('/api/race/subjects');
    if (su.ok && su.data) setSubjects(su.data.subjects ?? []);
  }, []);

  useEffect(() => {
    refreshMeta();
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [refreshMeta]);

  /**
   * Load a stored subject. Free — no vendor call, nothing billed. This is the
   * path for testing and for opening a demo on populated data rather than a
   * spinner.
   */
  const loadSubject = useCallback(async (subjectId: string) => {
    setBusy(true); setError(null); setHint(null); setRun(null);
    const res = await raceFetch<any>(`/api/race/subjects/${subjectId}/bundle`);
    setBusy(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? 'could not load that subject'); setHint(res.hint ?? null);
      return null;
    }
    setRun(res.data.run); setFromStore(true);
    return res.data as { subjectId: string; email?: string; run: Run; plan: any };
  }, []);

  const start = useCallback(async (opts: {
    email: string; sector?: string; ticketBand?: string; useCase?: string;
  }) => {
    setError(null); setHint(null); setRun(null); setBusy(true); setFromStore(false);
    const res = await raceFetch<any>('/api/race/run', {
      method: 'POST',
      body: {
        email: opts.email.trim(),
        useCase: opts.useCase ?? 'customer_insight',
        sector: opts.sector,
        ticketBand: opts.ticketBand,
        consentBasis: 'Opt-in: internal employee, consent on file',
      },
    });
    if (!res.ok || !res.data) {
      setError(res.error ?? 'request failed'); setHint(res.hint ?? null);
      setBusy(false); return;
    }

    const { runId, subjectId } = res.data;
    setRun({ runId, subjectId, status: 'running', costINR: 0, vendorsCalled: [], steps: [] });

    timer.current = window.setInterval(async () => {
      const r = await raceFetch<Run>(`/api/race/runs/${runId}`);
      if (!r.ok || !r.data) return;
      setRun(r.data);
      if (r.data.status !== 'running') {
        if (timer.current) window.clearInterval(timer.current);
        setBusy(false);
        refreshMeta();
      }
    }, 2000);
  }, [refreshMeta]);

  return { run, busy, error, hint, storage, subjects, estimateINR,
           spentThisMonth, fromStore, start, loadSubject, refreshMeta };
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
  run: Run | null; error: string | null; hint?: string | null; email: string;
  storage: { backend: string } | null; fromStore?: boolean;
}> = ({ run, error, hint, email, storage, fromStore }) => {
  const dot = (l: Step['level']) =>
    l === 'error' ? 'bg-red-500' : l === 'warn' ? 'bg-amber-500' : 'bg-neutral-300';
  const done = run?.status === 'completed';

  if (!run && !error) return null;

  return (
    <div className="space-y-2.5 pt-3">
      {error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle size={12} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <div className="text-[11px] text-red-700 font-medium">{error}</div>
            {hint && <div className="text-[10px] text-red-600 mt-0.5">{hint}</div>}
          </div>
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
              {fromStore
                ? `Loaded stored result for ${run!.subjectId} — no vendor call`
                : `Data fetched and stored successfully against ${run!.subjectId}`}
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
