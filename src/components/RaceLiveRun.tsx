import React, { useState, useRef, useEffect } from 'react';
import { Play, Loader2, AlertTriangle, Check, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Live identity resolution — the real pipeline, not the simulation.
 *
 * Calls POST /api/race/run, then polls the run record until it settles. What
 * you see is what actually happened: the vendor set the backend chose, each
 * call and what it returned, and the platforms found.
 *
 * The summary below is a DISPLAY view of the fetch. It is not the RACE intake
 * record — no tiering, no confidence bands, no dormancy detection. Those come
 * from the skill in stage 2, which is off by default.
 */

type Step = { t: string; level: 'info' | 'warn' | 'error'; msg: string; detail?: any };
type Account = { platform: string; vendor: string; registered?: boolean; detail?: string };
type Run = {
  runId: string; subjectId: string; status: string; costINR: number;
  vendorsCalled: { vendor: string; ok: boolean; itemCount?: number; error?: string }[];
  steps: Step[];
  summary?: { accounts: Account[]; platformCount: number; breachSources: string[] };
  error?: string;
};

const POLL_MS = 2000;

export const RaceLiveRun: React.FC = () => {
  const [email, setEmail] = useState('');
  const [consentBasis, setConsentBasis] = useState('Opt-in: internal employee, consent on file');
  const [token, setToken] = useState(() => sessionStorage.getItem('race_token') ?? '');
  const [run, setRun] = useState<Run | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  const headers = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(token ? { 'x-race-token': token } : {}),
  });

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
      } catch { /* keep polling; a dropped poll is not a failed run */ }
    }, POLL_MS);
  };

  const start = async () => {
    setError(null); setRun(null); setBusy(true);
    sessionStorage.setItem('race_token', token);
    try {
      const res = await fetch('/api/race/run', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ email: email.trim(), consentBasis, useCase: 'customer_insight' }),
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

  const dot = (level: Step['level']) =>
    level === 'error' ? 'bg-red-500' : level === 'warn' ? 'bg-amber-500' : 'bg-neutral-300';

  return (
    <div className="border border-neutral-200 rounded-xl bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">Live identity resolution</h3>
        <p className="text-xs text-neutral-400 mt-0.5">
          Real vendor calls against one address. Costs credits.
        </p>
      </div>

      <div className="px-5 py-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="subject@example.com" disabled={busy}
            className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-50"
          />
          <input
            type="password" value={token} onChange={(e) => setToken(e.target.value)}
            placeholder="access token" disabled={busy}
            className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-50"
          />
        </div>
        <input
          type="text" value={consentBasis} onChange={(e) => setConsentBasis(e.target.value)}
          placeholder="lawful basis for resolving this person" disabled={busy}
          className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-50"
        />
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          Stored with the run. Not checked — it is there so the run can be accounted for later.
        </p>

        <button
          type="button" onClick={start} disabled={busy || !email.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          <span>{busy ? 'Resolving…' : 'Run resolution'}</span>
        </button>

        {error && (
          <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
            <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
            <span className="text-xs text-red-700">{error}</span>
          </div>
        )}
      </div>

      {run && (
        <div className="border-t border-neutral-100 px-5 py-4 space-y-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
            <span className="font-semibold text-neutral-900">{run.subjectId}</span>
            <span className="text-neutral-400 font-mono">{run.runId}</span>
            <span className={run.status === 'failed' ? 'text-red-600' : 'text-neutral-500'}>
              {run.status}
            </span>
            {run.costINR > 0 && <span className="text-neutral-500">₹{run.costINR.toFixed(2)}</span>}
          </div>

          {run.vendorsCalled.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {run.vendorsCalled.map((v) => (
                <span key={v.vendor}
                  className={`px-2 py-1 rounded-md text-[11px] border ${
                    v.ok ? 'bg-neutral-50 border-neutral-200 text-neutral-600'
                         : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                  {v.vendor} · {v.ok ? `${v.itemCount ?? 0} item(s)` : v.error}
                </span>
              ))}
            </div>
          )}

          {run.steps.length > 0 && (
            <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-3 max-h-56 overflow-y-auto space-y-1.5">
              {run.steps.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px]">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dot(s.level)}`} />
                  <span className="text-neutral-400 font-mono shrink-0">{s.t.slice(11, 19)}</span>
                  <span className="text-neutral-700">{s.msg}</span>
                </div>
              ))}
            </div>
          )}

          {run.summary && run.summary.platformCount > 0 && (
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <h4 className="text-xs font-semibold text-neutral-900">
                  {run.summary.platformCount} platform{run.summary.platformCount === 1 ? '' : 's'}
                </h4>
                <span className="text-[11px] text-neutral-400">fetch only — not the RACE record</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {run.summary.accounts.map((a) => (
                  <span key={a.platform}
                    className="px-2 py-1 bg-white border border-neutral-200 rounded-md text-[11px] text-neutral-700">
                    {a.platform}
                    {a.detail && <span className="text-neutral-400"> · {a.detail}</span>}
                  </span>
                ))}
              </div>
              {run.summary.breachSources.length > 0 && (
                <p className="text-[11px] text-neutral-400 mt-2">
                  Breach sources: {run.summary.breachSources.join(', ')}
                  <span className="block mt-0.5">
                    Credentials from these are dropped before storage — only the source name is kept.
                  </span>
                </p>
              )}
            </div>
          )}

          {run.status === 'completed' && (
            <button type="button" onClick={() => setShowRaw(!showRaw)}
              className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900">
              {showRaw ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>Full record</span>
            </button>
          )}
          {showRaw && (
            <pre className="bg-neutral-900 text-neutral-200 text-[10px] rounded-lg p-3 overflow-auto max-h-72">
              {JSON.stringify(run, null, 2)}
            </pre>
          )}

          {run.status === 'completed' && !run.error && (
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <Check size={13} className="text-emerald-600" />
              <span>Stored against {run.subjectId}. Retrievable by email.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
