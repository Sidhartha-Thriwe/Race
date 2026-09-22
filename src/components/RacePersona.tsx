import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Download, Sparkles, Info, Key, Check } from 'lucide-react';
import { raceFetch } from './raceApi';

/**
 * Step 4 — the persona attribute table.
 *
 * Renders the same shape as the RACE segmentation tool: five groups, each row
 * carrying a value, a confidence band and the basis line that makes the claim
 * arguable.
 *
 * The audit strip above the table is the part worth defending. A persona reads
 * as authoritative whether or not it is, so the counts that tell you otherwise —
 * how many rows are Insufficient, how many basis lines carry no specifics —
 * belong on screen, not buried in the JSON. A table with no Insufficient rows on
 * a sparse subject has been filled in rather than derived, and the reader should
 * be able to see that at a glance.
 */

type Attribute = { label: string; value: string; confidence: string; basis: string };

export type Persona = {
  subjectId: string; model: string; createdAt: string;
  attributeGroups: { group: string; attributes: Attribute[] }[];
  computedTraits?: any;
  identityLocation?: string;
  personaSummary?: string;
  insights?: string[];
  exclusions?: string[];
  evidenceNote?: string;
  audit: { attributes: number; byBand: Record<string, number>;
           weakBasisLines: number; identityScrubbed: number };
  storedIn?: string;
};

const BAND_STYLE: Record<string, string> = {
  High: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  Medium: 'bg-blue-50 border-blue-200 text-blue-700',
  Low: 'bg-amber-50 border-amber-200 text-amber-700',
  Estimated: 'bg-violet-50 border-violet-200 text-violet-700',
  Insufficient: 'bg-neutral-100 border-neutral-200 text-neutral-500',
};

export const RacePersona: React.FC<{
  subjectId: string; enabled: boolean; initialPersona?: Persona | null;
}> = ({ subjectId, enabled, initialPersona }) => {
  const [persona, setPersona] = useState<Persona | null>(initialPersona ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [tab, setTab] = useState<'table' | 'traits' | 'summary'>('table');
  const [workspaceInput, setWorkspaceInput] = useState<string>(() => sessionStorage.getItem('anthropic_workspace_id') ?? '');
  const [showWorkspacePrompt, setShowWorkspacePrompt] = useState(false);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => { setPersona(initialPersona ?? null); setError(null); },
            [initialPersona, subjectId]);

  useEffect(() => {
    // Check if server or storage already has workspaceId configured
    raceFetch<{ workspaceId: string | null }>('/api/race/config/workspace').then((res) => {
      if (res.ok && res.data?.workspaceId) {
        setWorkspaceInput(res.data.workspaceId);
        sessionStorage.setItem('anthropic_workspace_id', res.data.workspaceId);
      }
    });
  }, []);

  const run = async (overrideWorkspace?: string) => {
    setBusy(true); setError(null); setHint(null); setPersona(null);
    const ws = (overrideWorkspace !== undefined ? overrideWorkspace : workspaceInput).trim();
    if (ws) {
      sessionStorage.setItem('anthropic_workspace_id', ws);
    }
    const res = await raceFetch<Persona>(`/api/race/subjects/${subjectId}/persona`, {
      method: 'POST',
      body: ws ? { workspaceId: ws } : {},
    });
    setBusy(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? 'request failed');
      setHint(res.hint ?? null);
      if (res.needsWorkspaceId || /anthropic-workspace-id|workspace/i.test(res.error ?? '')) {
        setShowWorkspacePrompt(true);
      }
      return;
    }
    setShowWorkspacePrompt(false);
    setPersona(res.data);
    setTab('table');
  };

  const handleSaveAndRun = async () => {
    const trimmed = workspaceInput.trim();
    if (!trimmed) return;
    setSavingWorkspace(true);
    sessionStorage.setItem('anthropic_workspace_id', trimmed);
    await raceFetch('/api/race/config/workspace', {
      method: 'POST',
      body: { workspaceId: trimmed },
    });
    setSavingWorkspace(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    await run(trimmed);
  };

  const a = persona?.audit;

  return (
    <div className="space-y-2.5">
      {/* Anthropic Workspace Configuration Banner if required or toggled */}
      {showWorkspacePrompt && (
        <div className="border border-amber-300 bg-amber-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Key size={14} className="text-amber-700" />
            <span>Anthropic Workspace ID Required</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-snug">
            Your Anthropic API key is an organization-level key and requires a Workspace ID header.
            Find your Workspace ID in{' '}
            <a
              href="https://platform.claude.com/settings/workspaces"
              target="_blank"
              rel="noreferrer"
              className="underline font-semibold text-amber-900"
            >
              Claude Console → Settings → Workspaces
            </a>{' '}
            (starts with <code className="bg-amber-100 px-1 py-0.5 rounded text-[10.5px] font-mono">wrkspc_</code>):
          </p>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="wrkspc_01AbCdEf23GhIj..."
              value={workspaceInput}
              onChange={(e) => setWorkspaceInput(e.target.value)}
              disabled={busy || savingWorkspace}
              className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-white border border-amber-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 text-neutral-800"
            />
            <button
              type="button"
              disabled={!workspaceInput.trim() || busy || savingWorkspace}
              onClick={handleSaveAndRun}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              {savingWorkspace ? (
                <Loader2 size={12} className="animate-spin" />
              ) : savedSuccess ? (
                <Check size={12} />
              ) : (
                <Sparkles size={12} />
              )}
              <span>{savingWorkspace ? 'Saving…' : 'Save & Build'}</span>
            </button>
          </div>
        </div>
      )}

      <button
        type="button" onClick={() => run()} disabled={!enabled || busy}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
          !enabled || busy
            ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
            : 'bg-[#1e40af] hover:bg-[#1d4ed8] text-white cursor-pointer active:scale-99'}`}
        id="race_step4_btn"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
        <span>{busy ? 'Synthesising persona…' : 'Step 4 Build Attributes'}</span>
      </button>

      <div className="flex items-center justify-between text-[10px] text-neutral-400 px-1">
        {!enabled ? (
          <span>Complete step 3 first — step 4 reasons over prior outputs.</span>
        ) : (
          <span>Step 4 synthesises attributes and computed traits.</span>
        )}
        <button
          type="button"
          onClick={() => setShowWorkspacePrompt(!showWorkspacePrompt)}
          className="text-neutral-500 hover:text-neutral-800 underline cursor-pointer ml-auto"
        >
          {workspaceInput ? 'Workspace ID set' : 'Set Workspace ID'}
        </button>
      </div>

      {error && !showWorkspacePrompt && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle size={12} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <div className="text-[11px] text-red-700 font-medium">{error}</div>
            {hint && <div className="text-[10px] text-red-600 mt-0.5">{hint}</div>}
          </div>
        </div>
      )}

      {persona && (
        <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
          <div className="px-3 py-2 bg-neutral-50 border-b border-neutral-100">
            <div className="text-[11px] font-bold text-neutral-800">
              Persona attributes — {persona.subjectId}
            </div>
            {a && (
              <div className="text-[10px] text-neutral-500 mt-0.5 flex flex-wrap gap-x-3">
                <span>{a.attributes} attributes</span>
                {Object.entries(a.byBand).map(([band, n]) => (
                  <span key={band}>{n} {band}</span>
                ))}
                <span className="text-neutral-400">{persona.model}</span>
              </div>
            )}
          </div>

          {/* The honesty checks, on screen rather than in the JSON. */}
          {a && (a.weakBasisLines > 0 || !a.byBand.Insufficient || a.identityScrubbed > 0) && (
            <div className="px-3 py-2 bg-amber-50 border-b border-amber-100 space-y-0.5">
              {!a.byBand.Insufficient && a.attributes > 0 && (
                <div className="text-[10px] text-amber-800">
                  No Insufficient rows — check whether thin evidence has been written
                  up as findings.
                </div>
              )}
              {a.weakBasisLines > 0 && (
                <div className="text-[10px] text-amber-800">
                  {a.weakBasisLines} basis line(s) cite no date, count or platform —
                  those claims cannot be checked.
                </div>
              )}
              {a.identityScrubbed > 0 && (
                <div className="text-[10px] text-amber-800">
                  {a.identityScrubbed} identity-shaped value(s) removed from the output.
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-1 px-2 pt-2 border-b border-neutral-100">
            {(['table', 'traits', 'summary'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`px-2.5 py-1.5 text-[10.5px] font-bold rounded-t-md capitalize ${
                  tab === t ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'}`}>
                {t === 'table' ? 'Attributes' : t}
              </button>
            ))}
            <a href={`/api/race/subjects/${persona.subjectId}/persona`} target="_blank" rel="noreferrer"
               className="ml-auto flex items-center gap-1 px-2 py-1 text-[10px] text-neutral-400 hover:text-neutral-900">
              <Download size={11} /> JSON
            </a>
          </div>

          <div className="max-h-96 overflow-auto text-[10.5px]">
            {tab === 'table' && persona.attributeGroups.map((g) => (
              <div key={g.group}>
                <div className="px-3 py-1.5 bg-neutral-50 font-bold text-neutral-600 sticky top-0">
                  {g.group}
                </div>
                {g.attributes.map((attr, i) => (
                  <div key={i} className="px-3 py-1.5 border-b border-neutral-50 last:border-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-bold text-neutral-800">{attr.label}</span>
                      <span className="text-neutral-700">{attr.value}</span>
                      <span className={`px-1.5 py-0.5 rounded border text-[9px] font-medium ${
                        BAND_STYLE[attr.confidence] ?? BAND_STYLE.Low}`}>
                        {attr.confidence}
                      </span>
                    </div>
                    <div className="text-neutral-400 mt-0.5">{attr.basis}</div>
                  </div>
                ))}
              </div>
            ))}

            {tab === 'traits' && persona.computedTraits && (
              <div className="p-3 space-y-2">
                {Object.entries(persona.computedTraits).map(([k, v]) =>
                  typeof v === 'object' && v !== null ? (
                    <div key={k}>
                      <div className="font-bold text-neutral-600 capitalize mb-0.5">{k}</div>
                      {Object.entries(v as Record<string, number>).map(([kk, vv]) => (
                        <Bar key={kk} label={kk} value={vv} />
                      ))}
                    </div>
                  ) : (
                    <Bar key={k} label={k} value={v as number} />
                  ))}
              </div>
            )}

            {tab === 'summary' && (
              <div className="p-3 space-y-3">
                {persona.identityLocation && (
                  <div>
                    <div className="font-bold text-neutral-600">Identity location</div>
                    <div className="text-neutral-700">{persona.identityLocation}</div>
                  </div>
                )}
                {persona.personaSummary && (
                  <div>
                    <div className="font-bold text-neutral-600">Summary</div>
                    <div className="text-neutral-700">{persona.personaSummary}</div>
                  </div>
                )}
                {persona.insights?.length ? (
                  <div>
                    <div className="font-bold text-neutral-600">Insights</div>
                    <ul className="list-disc pl-4 text-neutral-700 space-y-0.5">
                      {persona.insights.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  </div>
                ) : null}
                {persona.evidenceNote && (
                  <div>
                    <div className="font-bold text-neutral-600">What the evidence could not reach</div>
                    <div className="text-neutral-700">{persona.evidenceNote}</div>
                  </div>
                )}
                {persona.exclusions?.length ? (
                  <div>
                    <div className="font-bold text-neutral-600">Exclusions applied</div>
                    <ul className="list-disc pl-4 text-neutral-700 space-y-0.5">
                      {persona.exclusions.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex items-start gap-1.5 px-3 py-2 bg-neutral-50 border-t border-neutral-100">
            <Info size={11} className="text-neutral-400 shrink-0 mt-0.5" />
            <span className="text-[10px] text-neutral-500">
              Attributes and traits only — categories and offers are later steps with
              their own rules.{persona.storedIn && ` Saved to ${persona.storedIn}.`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const Bar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex items-center gap-2 py-0.5">
    <span className="w-40 shrink-0 text-neutral-500 capitalize truncate">
      {label.replace(/([A-Z])/g, ' $1').trim()}
    </span>
    <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
      <div className="h-full bg-neutral-700 rounded-full"
           style={{ width: `${Math.max(0, Math.min(10, Number(value) || 0)) * 10}%` }} />
    </div>
    <span className="w-6 text-right text-neutral-400 font-mono">{value}</span>
  </div>
);
