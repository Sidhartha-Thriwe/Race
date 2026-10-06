import React, { useState, useEffect, useRef } from 'react';
import { CustomerInsightRunData, SectorType } from './types';
import { EMPTY_RUN, mapRun, mapPlan, mapScrape, mapPersona, mapCategories } from './liveMap';
import type { Plan } from '../RaceTargets';
import type { Scrape } from '../RaceScrape';
import type { Persona } from '../RacePersona';
import type { Categories } from '../RaceCategories';
import { raceFetch } from '../raceApi';
import { Step1Subject } from './Step1Subject';
import { Step2IdentityMatch } from './Step2IdentityMatch';
import { Step3SourcePlan } from './Step3SourcePlan';
import { Step4ProfileFetch } from './Step4ProfileFetch';
import { Step5Persona } from './Step5Persona';
import { Step6Categories } from './Step6Categories';
import { GeneratingOrb } from '../GeneratingOrb';
import { useRaceRun } from '../RaceLiveRun';
import { Check } from 'lucide-react';

interface CustomerInsightWizardProps {
  onBackToCapabilities?: () => void;
}

type Live = { plan?: Plan; scrape?: Scrape; persona?: Persona; categories?: Categories };
type Banner = { msg: string; hint?: string; needsWorkspace?: boolean };

const MIN_MS = 4000;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const CustomerInsightWizard: React.FC<CustomerInsightWizardProps> = ({
  onBackToCapabilities,
}) => {
  const [data, setData] = useState<CustomerInsightRunData>({ ...EMPTY_RUN });
  const [live, setLive] = useState<Live>({});
  const [banner, setBanner] = useState<Banner | null>(null);
  const [workspaceInput, setWorkspaceInput] = useState('');
  const cancelled = useRef(false);

  const [maxStepReached, setMaxStepReached] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessages, setProcessingMessages] = useState<string[]>([]);
  const [processingSubtitle, setProcessingSubtitle] = useState<string>('');

  // Live RACE hooks & state
  const { busy, subjects, estimateINR, spentThisMonth, error: raceError, hint: raceHint,
          configuredVendors, start, loadSubject } = useRaceRun();

  // Month-to-date from the server; the pre-run estimate only while still on step 1.
  useEffect(() => {
    if (spentThisMonth != null) {
      setData((prev) => ({ ...prev, monthToDateINR: spentThisMonth }));
    }
    if (estimateINR != null && estimateINR > 0) {
      setData((prev) => (prev.step === 1 ? { ...prev, vendorSpendINR: estimateINR } : prev));
    }
  }, [spentThisMonth, estimateINR]);

  const handleUpdate = (partial: Partial<CustomerInsightRunData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  /**
   * The overlay stays up for at least MIN_MS and until `work` has actually
   * finished — a run, a scrape, a model call. `work` applies its own result and
   * returns false on failure, in which case the wizard stays where it was.
   */
  const runWithOverlay = async (
    messages: string[], subtitle: string, work: () => Promise<boolean>,
  ) => {
    setBanner(null);
    cancelled.current = false;
    setProcessingMessages(messages);
    setProcessingSubtitle(subtitle);
    setIsProcessing(true);
    try {
      await Promise.all([work().catch((e) => {
        setBanner({ msg: e?.message ?? 'Something went wrong' }); return false;
      }), sleep(MIN_MS)]);
    } finally {
      setIsProcessing(false);
    }
  };

  /** Start-then-poll for the model steps; the proxy in front of Cloud Run cuts a long response. */
  const pollDone = async <T extends { status?: string; error?: string }>(path: string): Promise<T | null> => {
    const deadline = Date.now() + 20 * 60 * 1000;
    while (Date.now() < deadline) {
      await sleep(5000);
      const r = await raceFetch<T>(path);
      if (!r.ok || !r.data) continue;          // a dropped poll is not a failed run
      if (r.data.status === 'running') continue;
      return r.data;
    }
    return null;
  };

  const workspaceBody = () => {
    const ws = sessionStorage.getItem('anthropic_workspace_id') ?? '';
    return ws ? { workspaceId: ws } : {};
  };

  const fail = (res: { error?: string; hint?: string; needsWorkspaceId?: boolean }, fallback: string) => {
    setBanner({
      msg: res.error ?? fallback, hint: res.hint,
      needsWorkspace: res.needsWorkspaceId || /workspace/i.test(res.error ?? ''),
    });
    return false;
  };

  const advanceTo = (step: number, patch: Partial<CustomerInsightRunData> = {}) => {
    setData((prev) => ({ ...prev, ...patch, step }));
    setMaxStepReached((prev) => Math.max(prev, step));
  };

  // ---------------------------------------------------------------- step 1
  const handleRunIdentityMatch = () => runWithOverlay(
    [
      'Connecting to Source 1 & Source 2...',
      'Verifying domain routing & email hash...',
      'Reading module footprints across vendors...',
      'Merging de-duplicated profile records...',
      'Saving identity match results to the audit store...',
    ],
    `Querying live intelligence graph for ${data.email || 'contact'} in ${data.sector}...`,
    async () => {
      const finished = await start({
        email: data.email,
        sector: data.sector,
        ticketBand: data.ticketPrice,
        useCase: 'customer_insight',
        vendors: configuredVendors.length > 0 ? configuredVendors : ['osint', 'bte'],
      });
      if (cancelled.current) return false;
      if (!finished) {
        setBanner({ msg: 'The run could not start.' });
        return false;
      }
      if (finished.status !== 'completed' || !finished.views) {
        setBanner({ msg: finished.error ?? 'The run did not complete, so there is nothing to show.' });
        return false;
      }
      setLive({});
      setData((prev) => ({
        ...EMPTY_RUN,
        sector: prev.sector, ticketPrice: prev.ticketPrice, isLawfulConsent: prev.isLawfulConsent,
        monthToDateINR: prev.monthToDateINR, isStored: false,
        ...mapRun(finished, prev.email), step: 2,
      }));
      setMaxStepReached(2);
      return true;
    },
  );

  // ----------------------------------------------------- stored subject (free)
  const handleLoadStoredSubject = (subjectId: string) => runWithOverlay(
    [
      `Loading stored bundle for ${subjectId}...`,
      'Retrieving verified identity modules...',
      'Restoring source plan and scrape results...',
      'Loading computed persona and ranked categories...',
    ],
    'Loading stored results without vendor charges.',
    async () => {
      const bundle: any = await loadSubject(subjectId);
      if (cancelled.current) return false;
      if (!bundle?.run?.views) {
        setBanner({ msg: raceError ?? `No stored run for ${subjectId}.`, hint: raceHint ?? undefined });
        return false;
      }
      const plan: Plan | undefined = bundle.plan ?? undefined;
      const scrape: Scrape | undefined = bundle.scrape ?? undefined;
      const persona: Persona | undefined =
        bundle.persona?.status !== 'failed' && bundle.persona?.attributeGroups?.length ? bundle.persona : undefined;
      const categories: Categories | undefined =
        bundle.categories?.status !== 'failed' && bundle.categories?.topCategories?.length ? bundle.categories : undefined;

      // A step is reachable only if everything before it exists.
      let reached = 2;
      if (plan) { reached = 3;
        if (scrape) { reached = 4;
          if (persona) { reached = 5;
            if (categories) reached = 6; } } }

      setLive({ plan, scrape, persona, categories });
      setData((prev) => ({
        ...EMPTY_RUN,
        sector: (bundle.run?.sector as SectorType) || prev.sector,
        ticketPrice: bundle.run?.ticketBand || prev.ticketPrice,
        isLawfulConsent: prev.isLawfulConsent, monthToDateINR: prev.monthToDateINR,
        isStored: true,
        ...mapRun(bundle.run, bundle.email ?? ''),
        ...(plan ? mapPlan(plan) : {}),
        ...(scrape ? mapScrape(scrape) : {}),
        ...(persona ? mapPersona(persona) : {}),
        ...(categories ? mapCategories(categories) : {}),
        step: 2,
      }));
      setMaxStepReached(reached);
      return true;
    },
  );

  const goToStep = (stepNumber: number) => {
    if (stepNumber <= maxStepReached) {
      setData((prev) => ({ ...prev, step: stepNumber }));
    }
  };

  // ------------------------------------------------ steps 2 → 3 … 5 → 6
  const handleNextStep = async () => {
    const id = data.subjectId;
    const base = `/api/race/subjects/${id}`;

    if (data.step === 2) {
      if (live.plan) return advanceTo(3);
      return runWithOverlay(
        ['Reading the module identifiers...', 'Checking which platforms have a readable public surface...',
         'Filtering login-walled and policy-excluded platforms...', 'Building the source routing plan...'],
        'Planning the profile fetch. Nothing is called and nothing is spent.',
        async () => {
          const res = await raceFetch<Plan>(`${base}/targets`, { method: 'POST' });
          if (!res.ok || !res.data) return fail(res, 'Could not build the source plan.');
          setLive((l) => ({ ...l, plan: res.data }));
          advanceTo(3, mapPlan(res.data));
          return true;
        });
    }

    if (data.step === 3) {
      if (live.scrape) return advanceTo(4);
      const plan = live.plan;
      if (!plan || plan.ready.length === 0) {
        setBanner({ msg: 'The plan has no source that is ready to fetch.' });
        return;
      }
      return runWithOverlay(
        ['Dispatching profile readers to the ready sources...', 'Waiting on each reader to return...',
         'Judging each result by the fields it returned...'],
        'Executing the reviewed source plan. This step spends and can take a few minutes.',
        async () => {
          const res = await raceFetch<Scrape>(`${base}/scrape`, {
            method: 'POST', body: { only: plan.ready.map((r) => r.platform) },
          });
          if (!res.ok || !res.data) return fail(res, 'The profile fetch failed.');
          setLive((l) => ({ ...l, scrape: res.data }));
          advanceTo(4, mapScrape(res.data));
          return true;
        });
    }

    if (data.step === 4) {
      if (live.persona) return advanceTo(5);
      return runWithOverlay(
        ['Handing the verified evidence to the persona model...', 'Deriving attributes with a confidence band and a basis line each...',
         'Computing trait scores...', 'Running the persona audit...'],
        'Deriving the persona from the stored profile data.',
        async () => {
          const res = await raceFetch<any>(`${base}/persona`, { method: 'POST', body: workspaceBody() });
          if (!res.ok) return fail(res, 'Could not start the persona step.');
          const p = await pollDone<Persona>(`${base}/persona`);
          if (cancelled.current) return false;
          if (!p) { setBanner({ msg: 'The persona step did not finish in time. It may still complete — load this subject again shortly.' }); return false; }
          if (p.status === 'failed') { setBanner({ msg: p.error ?? 'Persona synthesis failed.' }); return false; }
          // The payload is the evidence, not the status flag.
          if (!p.attributeGroups?.some((g) => g.attributes?.length)) {
            setBanner({ msg: 'The persona came back with no attributes, so it was not accepted.' });
            return false;
          }
          setLive((l) => ({ ...l, persona: p }));
          advanceTo(5, mapPersona(p));
          return true;
        });
    }

    if (data.step === 5) {
      if (live.categories) return advanceTo(6);
      return runWithOverlay(
        ['Scoring candidate affinity categories...', 'Checking each against the persona evidence...',
         'Ranking by evidence strength and psychological fit...', 'Recording why each rejected category lost...'],
        'Ranking categories only. Offers are a separate step.',
        async () => {
          const res = await raceFetch<any>(`${base}/categories`, { method: 'POST', body: workspaceBody() });
          if (!res.ok) return fail(res, 'Could not start the category step.');
          const c = await pollDone<Categories>(`${base}/categories`);
          if (cancelled.current) return false;
          if (!c) { setBanner({ msg: 'The category step did not finish in time. It may still complete — load this subject again shortly.' }); return false; }
          if (c.status === 'failed') { setBanner({ msg: c.error ?? 'Category derivation failed.' }); return false; }
          if (!c.topCategories?.length && !c.scoringTable?.length) {
            setBanner({ msg: 'The category step returned nothing, so it was not accepted.' });
            return false;
          }
          setLive((l) => ({ ...l, categories: c }));
          advanceTo(6, { ...mapCategories(c), model: c.model });
          return true;
        });
    }
  };

  const saveWorkspace = async () => {
    const ws = workspaceInput.trim();
    if (!ws) return;
    sessionStorage.setItem('anthropic_workspace_id', ws);
    await raceFetch('/api/race/config/workspace', { method: 'POST', body: { workspaceId: ws } });
    setBanner(null);
  };

  const handlePrevStep = () => {
    const prevStep = Math.max(data.step - 1, 1);
    setData((prev) => ({ ...prev, step: prevStep }));
  };

  const handleStartNewRun = () => {
    setLive({});
    setBanner(null);
    setMaxStepReached(1);
    setData((prev) => ({
      ...EMPTY_RUN,
      sector: prev.sector, ticketPrice: prev.ticketPrice,
      monthToDateINR: prev.monthToDateINR, vendorSpendINR: estimateINR ?? 0,
    }));
  };

  // Steps definition for left sidebar
  const wizardSteps = [
    {
      num: 1,
      title: 'Subject',
      subtitle: data.step > 1 ? `${data.sector} · ${data.ticketPrice}` : 'Sector and contact',
    },
    {
      num: 2,
      title: 'Identity match',
      subtitle: data.step >= 2 ? `${data.identityStats.modulesFound} modules found` : 'Two sources',
    },
    {
      num: 3,
      title: 'Source plan',
      subtitle: data.step >= 3 ? `${data.sourcePlan.readyCount} ready to fetch` : 'Plan only, free',
    },
    {
      num: 4,
      title: 'Enriched Data',
      subtitle: data.step >= 4 ? `${data.profileFetch.usable} of ${data.sourcePlan.readyCount} usable` : 'Public profiles',
    },
    {
      num: 5,
      title: 'Persona',
      subtitle: data.step >= 5 ? `${data.persona.attributesCount} attributes · ${data.persona.traitsCount} traits` : 'Attributes and traits',
    },
    {
      num: 6,
      title: 'Categories',
      subtitle: data.step >= 6 ? `${data.categories.rankedCount} ranked` : 'Ranked interests',
    },
  ];

  return (
    <div className="space-y-6 pb-16 font-sans select-none min-h-[calc(100vh-140px)] relative">
      {/* Processing Orb Loading Screen Overlay */}
      {isProcessing && (
        <GeneratingOrb
          isOverlay={true}
          messages={processingMessages}
          subtitle={processingSubtitle}
          intervalMs={4000}
          onCancel={() => { cancelled.current = true; setIsProcessing(false); }}
        />
      )}

      {banner && (
        <div className="rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-xs text-red-800 space-y-1.5">
          <div className="font-semibold">{banner.msg}</div>
          {banner.hint && <div className="text-red-700/80">{banner.hint}</div>}
          {banner.needsWorkspace && (
            <div className="flex items-center gap-2 pt-1">
              <input value={workspaceInput} onChange={(e) => setWorkspaceInput(e.target.value)}
                     placeholder="Anthropic workspace ID"
                     className="px-3 py-1.5 text-xs bg-white border border-red-200 rounded-lg w-64" />
              <button type="button" onClick={saveWorkspace}
                      className="px-3 py-1.5 text-xs font-semibold bg-white border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer">
                Save, then try again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Top Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/80 pb-4">
        {/* Left Breadcrumb */}
        <div className="flex items-center gap-2.5 text-xs font-medium text-neutral-500">
          <span className="font-bold text-neutral-900 tracking-wider">RACE</span>
          <span className="text-neutral-300">|</span>
          <span className="text-neutral-600">Internal Insight</span>
          <span className="text-neutral-400">›</span>
          <span className="font-bold text-neutral-900">Customer Insight</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {data.step === 1 ? (
            <>
              <span className="px-3 py-1.5 bg-neutral-100 border border-neutral-200/60 rounded-full text-xs font-semibold text-neutral-600">
                New run
              </span>
              {onBackToCapabilities && (
                <button
                  type="button"
                  onClick={onBackToCapabilities}
                  className="px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-full text-xs font-semibold text-neutral-700 transition-colors shadow-2xs cursor-pointer"
                >
                  Back to capabilities
                </button>
              )}
            </>
          ) : (
            <>
              <span className="px-3 py-1 bg-neutral-100 border border-neutral-200/80 rounded-full text-xs font-semibold text-neutral-700">
                {data.subjectId}
              </span>
              <span className="px-3 py-1 bg-neutral-100 border border-neutral-200/80 rounded-full text-xs font-semibold text-neutral-700">
                {data.sector} · {data.ticketPrice}
              </span>
              <button
                type="button"
                onClick={handleStartNewRun}
                className="px-3 py-1 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-full text-xs font-semibold text-neutral-700 transition-colors shadow-2xs cursor-pointer"
              >
                New run
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Workspace: Left Sidebar (Step Tracker & Telemetry) + Right Main Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          {/* Step Wizard Tracker */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs space-y-2">
            {wizardSteps.map((s) => {
              const isCurrent = data.step === s.num;
              const isCompleted = data.step > s.num;
              const isClickable = s.num <= maxStepReached;

              return (
                <div
                  key={s.num}
                  onClick={() => isClickable && goToStep(s.num)}
                  className={`p-2.5 rounded-xl transition-all flex items-center gap-3 ${
                    isCurrent
                      ? 'bg-neutral-100/90 shadow-2xs'
                      : isClickable
                      ? 'hover:bg-neutral-50 cursor-pointer'
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  {/* Step Circle / Check */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                      isCompleted
                        ? 'bg-[#1e293b] text-white'
                        : isCurrent
                        ? 'border-2 border-[#1e293b] text-[#1e293b] bg-white'
                        : 'border border-neutral-300 text-neutral-400 bg-white'
                    }`}
                  >
                    {isCompleted ? <Check size={13} strokeWidth={3} /> : s.num}
                  </div>

                  {/* Title & Subtitle */}
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-bold truncate ${
                      isCurrent ? 'text-neutral-900' : isCompleted ? 'text-neutral-800' : 'text-neutral-500'
                    }`}>
                      {s.title}
                    </div>
                    <div className="text-[11px] text-neutral-400 font-medium truncate">
                      {s.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* THIS RUN Telemetry Card */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="text-[10.5px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
              THIS RUN
            </div>

            <div className="space-y-2 text-xs">
              {data.step === 1 ? (
                <>
                  <div className="flex items-center justify-between text-neutral-600">
                    <span>Spent so far</span>
                    <span className="font-mono font-bold text-neutral-900 tabular-nums">₹0.00</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600">
                    <span>Month to date</span>
                    <span className="font-mono font-bold text-neutral-900 tabular-nums">
                      ₹{data.monthToDateINR.toFixed(2)}
                    </span>
                  </div>
                </>
              ) : data.step === 2 ? (
                <>
                  <div className="flex items-center justify-between text-neutral-600">
                    <span>Vendor spend</span>
                    <span className="font-mono font-bold text-neutral-900 tabular-nums">
                      ₹{data.vendorSpendINR.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600">
                    <span>Month to date</span>
                    <span className="font-mono font-bold text-neutral-900 tabular-nums">
                      ₹{data.monthToDateINR.toFixed(2)}
                    </span>
                  </div>
                </>
              ) : data.step === 3 ? (
                <>
                  <div className="flex items-center justify-between text-neutral-600">
                    <span>Vendor spend</span>
                    <span className="font-mono font-bold text-neutral-900 tabular-nums">
                      ₹{data.vendorSpendINR.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600">
                    <span>Source plan</span>
                    <span className="font-semibold text-neutral-800">Free</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-neutral-600">
                    <span>Vendor spend</span>
                    <span className="font-mono font-bold text-neutral-900 tabular-nums">
                      ₹{data.vendorSpendINR.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600">
                    <span>Fetch spend</span>
                    <span className="font-mono font-bold text-neutral-900 tabular-nums">
                      ${data.fetchSpendUSD.toFixed(2)}
                    </span>
                  </div>
                  {data.step >= 5 && (
                    <div className="flex items-center justify-between text-neutral-600">
                      <span>Model</span>
                      <span className="font-mono text-[11px] font-semibold text-neutral-900">
                        {data.model}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RUN LOG Card (on Step 2) */}
          {data.step === 2 && data.runLog.length > 0 && (
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs space-y-2.5">
              <div className="text-[10.5px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                RUN LOG
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                {data.runLog.map((log, idx) => (
                  <div key={idx} className="flex items-baseline gap-2.5 text-neutral-600">
                    <span className="text-neutral-400 shrink-0">{log.time}</span>
                    <span className="truncate">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Main Stage: Steps 1 to 6 */}
        <div className="lg:col-span-9 min-w-0">
          {data.step === 1 && (
            <Step1Subject
              data={data}
              subjects={subjects}
              busy={busy || isProcessing}
              onUpdate={handleUpdate}
              onRunIdentityMatch={handleRunIdentityMatch}
              onLoadSubject={handleLoadStoredSubject}
            />
          )}

          {data.step === 2 && (
            <Step2IdentityMatch
              data={data}
              onBack={handlePrevStep}
              onNext={handleNextStep}
              busy={busy || isProcessing}
            />
          )}

          {data.step === 3 && (
            <Step3SourcePlan
              data={data}
              onBack={handlePrevStep}
              onNext={handleNextStep}
              busy={busy || isProcessing}
            />
          )}

          {data.step === 4 && (
            <Step4ProfileFetch
              data={data}
              onBack={handlePrevStep}
              onNext={handleNextStep}
              busy={busy || isProcessing}
            />
          )}

          {data.step === 5 && (
            <Step5Persona
              data={data}
              onBack={handlePrevStep}
              onNext={handleNextStep}
              busy={busy || isProcessing}
            />
          )}

          {data.step === 6 && (
            <Step6Categories
              data={data}
              onBack={handlePrevStep}
              onStartNewRun={handleStartNewRun}
              busy={busy || isProcessing}
            />
          )}
        </div>
      </div>
    </div>
  );
};
