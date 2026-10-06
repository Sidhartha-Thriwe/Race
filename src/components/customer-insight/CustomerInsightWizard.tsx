import React, { useState, useEffect } from 'react';
import { CustomerInsightRunData, SAMPLE_S01_DATA, SectorType } from './types';
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

export const CustomerInsightWizard: React.FC<CustomerInsightWizardProps> = ({
  onBackToCapabilities,
}) => {
  const [data, setData] = useState<CustomerInsightRunData>({
    ...SAMPLE_S01_DATA,
    step: 1,
    isStored: false,
    email: '',
    isLawfulConsent: true,
  });

  const [maxStepReached, setMaxStepReached] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessages, setProcessingMessages] = useState<string[]>([]);
  const [processingSubtitle, setProcessingSubtitle] = useState<string>('');

  // Live RACE hooks & state
  const { run, busy, storage, subjects, estimateINR, spentThisMonth,
          configuredVendors, start, loadSubject } = useRaceRun();

  // Sync monthly spend from server if available
  useEffect(() => {
    if (spentThisMonth != null) {
      setData((prev) => ({ ...prev, monthToDateINR: spentThisMonth }));
    }
    if (estimateINR != null && estimateINR > 0) {
      setData((prev) => ({ ...prev, vendorSpendINR: estimateINR }));
    }
  }, [spentThisMonth, estimateINR]);

  const handleUpdate = (partial: Partial<CustomerInsightRunData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const triggerProcessingTransition = (
    messages: string[],
    subtitle: string,
    onFinish: () => void,
    durationMs: number = 4200
  ) => {
    setProcessingMessages(messages);
    setProcessingSubtitle(subtitle);
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      onFinish();
    }, durationMs);
  };

  const handleRunIdentityMatch = async () => {
    const messages = [
      'Connecting to OSINT Industries & Behind the Email...',
      'Verifying domain routing & email hash...',
      'Resolving 42 module footprints across vendors...',
      'Merging de-duplicated profile records...',
      'Saving identity match results to audit store...'
    ];
    const subtitle = `Querying live intelligence graph for ${data.email || 'contact'} in ${data.sector}...`;

    triggerProcessingTransition(messages, subtitle, () => {
      if (data.isStored) {
        setData((prev) => ({
          ...prev,
          ...SAMPLE_S01_DATA,
          step: 2,
          sector: prev.sector,
          ticketPrice: prev.ticketPrice,
        }));
        setMaxStepReached(Math.max(maxStepReached, 6));
      } else {
        start({
          email: data.email,
          sector: data.sector,
          ticketBand: data.ticketPrice,
          useCase: 'customer_insight',
          vendors: configuredVendors.length > 0 ? configuredVendors : ['osint', 'bte'],
        });

        setData((prev) => ({
          ...prev,
          step: 2,
          subjectId: 'Subject P-20',
          runLog: [
            { time: new Date().toLocaleTimeString(), message: 'Run accepted' },
            { time: new Date().toLocaleTimeString(), message: 'Two vendors set' },
            { time: new Date().toLocaleTimeString(), message: 'Processing vendor streams...' },
          ],
        }));
        setMaxStepReached(Math.max(maxStepReached, 2));
      }
    }, 4500);
  };

  const handleLoadStoredSubject = async (subjectId: string) => {
    const messages = [
      `Loading stored bundle for ${subjectId}...`,
      'Retrieving verified identity modules...',
      'Restoring source plan and scrape results...',
      'Loading computed persona and ranked categories...'
    ];
    triggerProcessingTransition(messages, 'Loading cached artifact without vendor charges.', async () => {
      const bundle = await loadSubject(subjectId);
      if (bundle) {
        setData((prev) => ({
          ...prev,
          ...SAMPLE_S01_DATA,
          step: 2,
          subjectId,
          email: bundle.email || prev.email,
          sector: (bundle.run?.sector as SectorType) || prev.sector,
          ticketPrice: bundle.run?.ticketBand || prev.ticketPrice,
        }));
        setMaxStepReached(6);
      } else {
        setData((prev) => ({
          ...prev,
          ...SAMPLE_S01_DATA,
          step: 2,
          subjectId,
        }));
        setMaxStepReached(6);
      }
    }, 3800);
  };

  const goToStep = (stepNumber: number) => {
    if (stepNumber <= maxStepReached) {
      setData((prev) => ({ ...prev, step: stepNumber }));
    }
  };

  const handleNextStep = () => {
    const nextStep = Math.min(data.step + 1, 6);

    // Custom messages for each step transition
    let messages: string[] = [];
    let subtitle = '';

    if (data.step === 2) {
      messages = [
        'Analyzing 42 module identifiers...',
        'Checking actor policies and rate limit rules...',
        'Filtering login-walled and policy-excluded platforms...',
        'Constructing verified source routing plan...'
      ];
      subtitle = 'Planning profile fetch without calling unverified endpoints.';
    } else if (data.step === 3) {
      messages = [
        'Dispatching profile readers to 4 ready sources...',
        'Extracting professional credentials from LinkedIn...',
        'Parsing learner telemetry from Duolingo...',
        'Handling contested stub responses...',
        'Compiling 58 field attributes...'
      ];
      subtitle = 'Executing reviewed source plan ($0.05 spend).';
    } else if (data.step === 4) {
      messages = [
        'Initializing Claude Opus 5 synthesis pipeline...',
        'Extracting 38 verified behavioral attributes...',
        'Computing 6 psychographic trait propensity scores...',
        'Generating dimensional spider chart vector weights...',
        'Finalizing persona audit breakdown...'
      ];
      subtitle = 'Deriving psychographic persona models from verified profile data.';
    } else if (data.step === 5) {
      messages = [
        'Scoring 15 candidate affinity categories...',
        'Evaluating career density and spend signal flags...',
        'Ranking top 4 high-propensity categories...',
        'Applying disposition notes to 11 set-aside items...',
        'Synthesizing final category intelligence...'
      ];
      subtitle = 'Calibrating interest rankings by evidence and psychological fit.';
    }

    if (messages.length > 0) {
      triggerProcessingTransition(messages, subtitle, () => {
        setData((prev) => ({ ...prev, step: nextStep }));
        setMaxStepReached((prev) => Math.max(prev, nextStep));
      }, 4200);
    } else {
      setData((prev) => ({ ...prev, step: nextStep }));
      setMaxStepReached((prev) => Math.max(prev, nextStep));
    }
  };

  const handlePrevStep = () => {
    const prevStep = Math.max(data.step - 1, 1);
    setData((prev) => ({ ...prev, step: prevStep }));
  };

  const handleStartNewRun = () => {
    setData((prev) => ({
      ...prev,
      step: 1,
      isStored: false,
      email: '',
      isLawfulConsent: true,
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
      subtitle: data.step >= 2 ? `${data.identityStats.modulesFound} modules found` : 'Two vendors',
    },
    {
      num: 3,
      title: 'Source plan',
      subtitle: data.step >= 3 ? `${data.sourcePlan.readyCount} ready to fetch` : 'Plan only, free',
    },
    {
      num: 4,
      title: 'Profile fetch',
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
          onCancel={() => setIsProcessing(false)}
        />
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
