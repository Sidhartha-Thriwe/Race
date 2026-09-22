import React, { useState, useRef, useEffect } from 'react';
import { Zap, Loader2, AlertTriangle, CheckCircle2, Database, HardDrive } from 'lucide-react';

/**
 * Live identity resolution — the real pipeline.
 *
 * Type a subject email, click run. The backend calls OSINT Industries, stores
 * the result against that email and a subject id, and reports back. The log is
 * real: every line is something that actually happened on the server.
 *
 * The platform list below is a display view of the fetch. It is NOT the RACE
 * intake record — no tiering, no confidence bands, no dormancy detection.
 */

type Step = { t: string; level: 'info' | 'warn' | 'error'; msg: string };
type Account = { platform: string; vendor: string; detail?: string };
type Run = {
  runId: string; subjectId: string; status: string; costINR: number;
  vendorsCalled: { vendor: string; ok: boolean; itemCount?: number; error?: string }[];
  steps: Step[];
  summary?: { accounts: Account[]; platformCount: number; breachSources: string[] };
  error?: string;
};

export const RaceLiveRun: React.FC<{ useCase?: string; ticketBand?: string }> = ({
  useCase = 'customer_insight', ticketBand,
}) => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(() => sessionStorage.getItem('race_token') ?? '');
  const [run, setRun] = useState<Run | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storage, setStorage] = useState<{ backend: string } | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  const headers = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(token ? { 'x-race-token': token } : {}),
  });

  useEffect(() => {
    fetch('/api/race/status', { headers: headers() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.storage && setStorage(d.storage))
      .catch(() => { /* status is a nicety, not a blocker */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const poll = (runId: string) => {
    timer.current = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/race/runs/${runId}`, { headers: headers() });
        if (!res.ok) return;
        const data: Run = await res.json();
        setRun(data);
        if (data.status !== 'running') {
          if (timer.current) window.clearInterval(timer.current);
          setBusy(false);
        }
      } catch { /* a dropped poll is not a failed run */ }
    }, 2000);
  };

  const start = async () => {
    setError(null); setRun(null); setBusy(true);
    sessionStorage.setItem('race_token', token);
    try {
      const res = await fetch('/api/race/run', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({
          email: email.trim(), useCase, ticketBand,
          consentBasis: 'Opt-in: internal employee, consent on file',
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? `HTTP ${res.status}`); setBusy(false); return; }
      setRun({ runId: data.runId, subjectId: data.subjectId, status: 'running',
               costINR: 0, vendorsCalled: [], steps: [] });
      poll(data.runId);
    } catch (e: any) {
      setError(e?.message ?? 'request failed'); setBusy(false);
    }
  };

  const dot = (l: Step['level']) =>
    l === 'error' ? 'bg-red-500' : l === 'warn' ? 'bg-amber-500' : 'bg-neutral-300';

  const done = run?.status === 'completed';

  return (
    <div className="border border-neutral-200 rounded-xl p-4 space-y-3 bg-neutral-50/60">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-[11px] uppercase font-bold text-neutral-500 tracking-wider">
            Live identity resolution
          </h4>
          <p className="text-[10px] text-neutral-400 mt-0.5">
            Real vendor call on one subject. Spends credits.
          </p>
        </div>
        {storage && (
          <span className="flex items-center gap-1 text-[10px] text-neutral-400">
            {storage.backend === 'firestore'
              ? <><Database size={11} /> Firestore</>
              : <><HardDrive size={11} /> local disk</>}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Subject email" disabled={busy}
          className="sm:col-span-2 px-3 py-2 text-xs border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-100"
        />
        <input
          type="password" value={token} onChange={(e) => setToken(e.target.value)}
          placeholder="Access token" disabled={busy}
          className="px-3 py-2 text-xs border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-100"
        />
      </div>

      <button
        type="button" onClick={start} disabled={busy || !email.trim()}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
          busy || !email.trim()
            ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
            : 'bg-neutral-900 hover:bg-neutral-800 text-white cursor-pointer active:scale-98'}`}
        id="race_live_run_btn"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
        <span>{busy ? 'Fetching and storing…' : 'Fetch & store subject data'}</span>
      </button>

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle size={12} className="text-red-500 mt-0.5 shrink-0" />
          <span className="text-[11px] text-red-700">{error}</span>
        </div>
      )}

      {run && run.steps.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg p-2.5 max-h-40 overflow-y-auto space-y-1">
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
        <div className="px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-lg space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
            <span className="text-[11px] font-bold text-emerald-900">
              Stored successfully against {run!.subjectId}
            </span>
          </div>
          <p className="text-[10px] text-emerald-800 pl-5">
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
                className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-[10px] text-neutral-700">
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
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
          <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
          <span className="text-[11px] text-amber-800">{run.error ?? 'run failed'}</span>
        </div>
      )}
    </div>
  );
};
