import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, CheckCircle2, Database, HardDrive } from 'lucide-react';

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
export type Run = {
  runId: string; subjectId: string; status: string; costINR: number;
  vendorsCalled: { vendor: string; ok: boolean; itemCount?: number; error?: string }[];
  steps: Step[];
  summary?: { accounts: Account[]; platformCount: number; breachSources: string[] };
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
            {email} · {run!.summary?.platformCount ?? 0} platform
            {run!.summary?.platformCount === 1 ? '' : 's'} · ₹{run!.costINR.toFixed(2)}
            {storage?.backend === 'firestore' ? ' · saved to Firestore' : ' · saved to disk'}
          </p>
        </div>
      )}

      {done && run?.summary && run.summary.platformCount > 0 && (
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              Platforms found
            </span>
            <span className="text-[9.5px] text-neutral-400">fetch only — not the RACE record</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {run.summary.accounts.map((a) => (
              <span key={a.platform}
                className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-[10px] text-neutral-700 font-medium">
                {a.platform}
                {a.detail && <span className="text-neutral-400"> · {a.detail}</span>}
              </span>
            ))}
          </div>
          {run.summary.breachSources.length > 0 && (
            <p className="text-[9.5px] text-neutral-400 mt-1.5">
              Breach sources: {run.summary.breachSources.join(', ')} — credentials dropped before storage.
            </p>
          )}
        </div>
      )}

      {run?.status === 'failed' && (
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
          <span className="text-[11px] text-amber-800 font-medium">{run.error ?? 'run failed'}</span>
        </div>
      )}
    </div>
  );
};

export const RunSpinner: React.FC = () => <Loader2 size={13} className="animate-spin" />;
