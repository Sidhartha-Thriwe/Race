import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Activity, UploadCloud, FileSpreadsheet, Lock, Copy, X, Check, AlertTriangle, ChevronRight } from 'lucide-react';
import { QualCampaign, QualFile } from './LeadQualification';
import {
  WizardHeader,
  WizardCard,
  CollapsibleCard,
  WizardFooter,
  TopEmailsStep,
  ReviewConsentStep,
  buildConsent,
  emailsComplete,
  cleanEmails,
  hasInvalidEmails,
  FieldLabel,
  inputCls,
  Chip,
} from './campaign-builder/wizard';

interface LeadQualCampaignBuilderProps {
  selectedCampaign: QualCampaign | null;
  onCancel: () => void;
  onRun: (campaignData: Partial<QualCampaign> & { fileToRun: Omit<QualFile, 'id'> }) => void;
  onClone: (campaign: QualCampaign) => void;
}

const STEPS = ['Basics', 'Audience file', 'Top 5 emails', 'Review & consent'];

const INDUSTRY_BUSINESS_LINES_MAP: Record<string, string[]> = {
  'Automobile': ['New Sale', 'Resale', 'Services', 'Parts'],
  'Real Estate': ['New Launch', 'Resale', 'Rentals / Leasing', 'Commercial'],
  'Luxury Watches': ['New Watches', 'Pre-owned', 'Servicing & Repairs', 'Accessories'],
  'Wealth Management': ['Wealth Advisory', 'Portfolio Management', 'Private Banking', 'Structured Products'],
  'Financial Services': ['Wealth Advisory', 'Mutual Funds', 'Credit Cards', 'Insurance', 'Legacy Trust'],
  'Technology': ['Enterprise Software', 'Cloud Services', 'Hardware Solutions', 'Consulting'],
  'Healthcare': ['Clinical Services', 'Diagnostics', 'Preventive Care', 'Specialty Treatments']
};

const Tile: React.FC<{ label: string; value: string; sub?: string; tone?: 'ok' | 'warn' }> = ({ label, value, sub, tone }) => (
  <div className="rounded-lg bg-neutral-50 border border-neutral-200/70 p-4">
    <div className="text-[11px] text-neutral-500 font-medium">{label}</div>
    <div className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">{value}</div>
    {sub && (
      <div className={`mt-0.5 text-[11px] font-medium ${tone === 'warn' ? 'text-amber-600' : tone === 'ok' ? 'text-emerald-600' : 'text-neutral-400'}`}>{sub}</div>
    )}
  </div>
);

const LockedNote: React.FC = () => (
  <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400 font-mono"><Lock size={10} /> Locked</span>
);

export const LeadQualCampaignBuilder: React.FC<LeadQualCampaignBuilderProps> = ({
  selectedCampaign,
  onCancel,
  onRun,
  onClone
}) => {
  // 1. Client profile pulled from Client Onboarding
  const clientProfile = useMemo(() => {
    try {
      const stored = localStorage.getItem('race_active_client') || localStorage.getItem('zenith_client_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        const ind = parsed.industry || 'Automobile';
        return {
          name: parsed.clientName || 'Zenith Luxury Motors',
          industry: ind,
          ticketSize: parsed.avgTicketSize || 2500000,
          purchaseChannel: parsed.purchaseChannel || 'Both',
          businessLines: parsed.businessLines && parsed.businessLines.length > 0 
            ? parsed.businessLines 
            : (INDUSTRY_BUSINESS_LINES_MAP[ind] || ['New Sale', 'Resale', 'Services', 'Parts'])
        };
      }
    } catch {
      // Fallback
    }
    return {
      name: 'Zenith Luxury Motors',
      industry: 'Automobile',
      ticketSize: 2500000,
      purchaseChannel: 'Both',
      businessLines: ['New Sale', 'Resale', 'Services', 'Parts']
    };
  }, []);

  // Check if existing campaign with locked parameters
  const isExistingCampaign = Boolean(selectedCampaign && (selectedCampaign.hasRunFirstFile || (selectedCampaign.files && selectedCampaign.files.length > 0)));

  // Form states
  const [campaignName, setCampaignName] = useState<string>('');
  const [targetCQC, setTargetCQC] = useState<number>(18);
  const [businessLine, setBusinessLine] = useState<string>('');
  
  // Advanced settings (collapsible, closed by default)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // File upload state
  const [pendingFile, setPendingFile] = useState<{
    name: string;
    size: string;
    rowsAccepted: number;
    rowsSkipped: number;
    skipReasons: Array<{ count: number; reason: string }>;
    cost: number;
  } | null>(null);

  const [step, setStep] = useState<number>(1);
  const [emails, setEmails] = useState<string[]>(['', '', '', '', '']);
  const [acks, setAcks] = useState<boolean[]>([false, false, false, false]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [moreOptionsOpen, setMoreOptionsOpen] = useState<boolean>(false);

  // Processing simulation state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or hydrate form
  useEffect(() => {
    if (selectedCampaign) {
      setCampaignName(selectedCampaign.name);
      setTargetCQC(selectedCampaign.targetCQC || selectedCampaign.targetCostPerQualifiedLead || 18);
      setBusinessLine(selectedCampaign.businessLine || selectedCampaign.targetProduct || clientProfile.businessLines[0] || 'New Sale');
      setNotes(selectedCampaign.notes || '');
    } else {
      setCampaignName('Zenith Festive Tier-1 Qualification');
      setTargetCQC(18);
      setBusinessLine(clientProfile.businessLines[0] || 'New Sale');
      setNotes('');
    }
    setPendingFile(null);
    setStep(1);
    setEmails(['', '', '', '', '']);
    setAcks([false, false, false, false]);
  }, [selectedCampaign, clientProfile]);

  // Scroll to top on step change
  useEffect(() => {
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* noop */ }
  }, [step]);

  // Simulate file load and validation
  const simulateFileLoad = (fileName: string, fileSize: string) => {
    const accepted = Math.floor(Math.random() * 800 + 1200); // 1200 - 2000 accepted
    const missingContactSkipped = Math.floor(Math.random() * 24 + 14); // missing email AND phone
    const optOutSkipped = Math.floor(Math.random() * 18 + 8); // DND / opt-out
    const duplicateSkipped = Math.floor(Math.random() * 12 + 4); // Duplicate in campaign
    const totalSkipped = missingContactSkipped + optOutSkipped + duplicateSkipped;
    
    // Qualification cost: approx ₹16 per accepted record
    const costPerAccepted = 16.0;
    const totalCost = Math.round(accepted * costPerAccepted);

    setPendingFile({
      name: fileName,
      size: fileSize,
      rowsAccepted: accepted,
      rowsSkipped: totalSkipped,
      skipReasons: [
        { count: missingContactSkipped, reason: "Missing both email ID and phone number (skipped individually)" },
        { count: optOutSkipped, reason: "National DND / internal opt-out suppression match" },
        { count: duplicateSkipped, reason: "Duplicate contact record matched with active campaign ledger" }
      ],
      cost: totalCost
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      simulateFileLoad(file.name, sizeStr);
    } else {
      simulateFileLoad("q4_luxury_leads_batch_01.xlsx", "2.14 MB");
    }
  };

  const handleNativeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      simulateFileLoad(file.name, sizeStr);
    }
    if (e.target) e.target.value = '';
  };

  // Computed Cost & Est. CQC metrics
  const estCQC = useMemo(() => {
    if (!pendingFile || pendingFile.rowsAccepted === 0) return 0;
    return Math.round(pendingFile.cost / pendingFile.rowsAccepted);
  }, [pendingFile]);

  const isWithinTarget = useMemo(() => {
    if (!pendingFile || estCQC === 0) return true;
    return estCQC <= targetCQC;
  }, [estCQC, targetCQC, pendingFile]);

  // Campaign running total calculation
  const priorTotalSpend = useMemo(() => {
    if (selectedCampaign && selectedCampaign.totalSpend) {
      return selectedCampaign.totalSpend;
    }
    return 0;
  }, [selectedCampaign]);

  const runningTotalSpend = useMemo(() => {
    const fileCost = pendingFile ? pendingFile.cost : 0;
    return priorTotalSpend + fileCost;
  }, [priorTotalSpend, pendingFile]);

  // Form Validation check
  const isFormValid = useMemo(() => {
    if (!campaignName.trim()) return false;
    if (!targetCQC || targetCQC <= 0) return false;
    if (!businessLine) return false;
    if (!pendingFile || pendingFile.rowsAccepted <= 0) return false;
    return true;
  }, [campaignName, targetCQC, businessLine, pendingFile]);

  const allAcked = acks.every(Boolean);
  const canRun = isFormValid && allAcked && !hasInvalidEmails(emails);

  // Execute Run Simulation
  const handleRunClick = () => {
    setTouched({
      campaignName: true,
      targetCQC: true,
      businessLine: true,
      file: true
    });

    if (!canRun || !pendingFile) return;

    setIsProcessing(true);
    setProgress(0);
    setLogs([]);

    const logSteps = [
      `[INIT] Validating audience roster file: ${pendingFile.name} (${pendingFile.size})`,
      `[TARGET] Target CQC: ₹${targetCQC} | Est. File CQC: ₹${estCQC} | Business Line: ${businessLine}`,
      `[COMPLIANCE] Verified multi-attribute data collection consent confirmed`,
      `[VALIDATION] Verified ${pendingFile.rowsAccepted} accepted rows. Skipped ${pendingFile.rowsSkipped} incomplete/DND records`,
      `[RACE ENGINE] Triggering demographic & psychographic intent scoring models...`,
      `[CONFIDENCE] Segregating High, Medium, and Low confidence tiers...`,
      `[LEDGER] Registering evaluated cohort into Campaign Management...`,
      `[SUCCESS] 100% processed. ${pendingFile.rowsAccepted} qualified leads loaded successfully!`
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < logSteps.length) {
        setLogs(prev => [...prev, logSteps[currentStep]]);
        setProgress(prev => Math.min(prev + 13, 100));
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onRun({
            name: campaignName.trim(),
            targetCQC: targetCQC,
            targetCostPerQualifiedLead: targetCQC,
            businessLine: businessLine,
            targetProduct: businessLine,
            industry: clientProfile.industry,
            notes: notes.trim(),
            topEmails: cleanEmails(emails),
            consent: buildConsent('qualification'),
            fileToRun: {
              fileName: pendingFile.name,
              fileSize: pendingFile.size,
              rowsAccepted: pendingFile.rowsAccepted,
              rowsSkipped: pendingFile.rowsSkipped,
              skipReasons: pendingFile.skipReasons,
              cost: pendingFile.cost,
              dateUploaded: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              status: 'Processing'
            }
          });
          setIsProcessing(false);
        }, 700);
      }
    }, 700);
  };

  const goNext = () => setStep((s) => Math.min(4, s + 1));
  const goBack = () => (step === 1 ? onCancel() : setStep((s) => s - 1));

  const step1Valid = Boolean(campaignName.trim()) && targetCQC > 0 && Boolean(businessLine);
  const step2Valid = Boolean(pendingFile && pendingFile.rowsAccepted > 0);

  const nextDisabled =
    step === 1 ? !step1Valid : step === 2 ? !step2Valid : step === 3 ? hasInvalidEmails(emails) : !canRun;

  const handleNext = () => {
    if (step === 1) {
      setTouched((p) => ({ ...p, campaignName: true, targetCQC: true, businessLine: true }));
      if (!step1Valid) return;
      goNext();
    } else if (step === 2) {
      setTouched((p) => ({ ...p, file: true }));
      if (!step2Valid) return;
      goNext();
    } else if (step === 3) {
      if (hasInvalidEmails(emails)) return;
      goNext();
    }
  };

  const title = isExistingCampaign ? `Add File: ${selectedCampaign?.name}` : 'Create Qualification Campaign';
  const subtitle = isExistingCampaign
    ? "Upload another audience file under this campaign's fixed Target CQC and Business line."
    : 'Target-first lead qualification setup powered by your verified client profile.';

  const reviewSections = [
    {
      heading: 'Basics',
      rows: [
        ['Campaign name', campaignName.trim() || '—'],
        ['Target CQC', `₹${targetCQC}`],
        ['Business line', businessLine || '—'],
      ] as [string, string][],
    },
    {
      heading: 'Audience file',
      rows: [
        ['File', pendingFile ? `${pendingFile.name} (${pendingFile.size})` : '—'],
        ['Rows', pendingFile ? `${pendingFile.rowsAccepted.toLocaleString('en-IN')} accepted · ${pendingFile.rowsSkipped.toLocaleString('en-IN')} skipped` : '—'],
        ['Cost estimate', pendingFile ? `₹${pendingFile.cost.toLocaleString('en-IN')}` : '—'],
        ['Est. CQC vs target', pendingFile ? `₹${estCQC} vs ₹${targetCQC}` : '—'],
        ['Internal notes', notes.trim() || 'None'],
      ] as [string, string][],
    },
    {
      heading: 'Top 5 emails',
      rows: [['Added', `${cleanEmails(emails).length} of 5 added`]] as [string, string][],
    },
  ];

  return (
    <div className="space-y-6 w-full pb-16 font-sans" id="lead-qual-builder-container">
      {isProcessing ? (
        <div className="bg-white rounded-[20px] p-8 sm:p-12 shadow-[0_0_0_1px_rgba(0,0,0,0.06)] text-center space-y-6 max-w-2xl mx-auto my-8">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-[#f5f5f7] rounded-full">
            <Activity className="text-[#0071e3] animate-pulse" size={28} />
            <span className="absolute text-[10px] font-bold text-[#1d1d1f]">{progress}%</span>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-[22px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">Qualifying leads and evaluating intent graph...</h3>
            <p className="text-[15px] text-[#6e6e73] max-w-md mx-auto leading-relaxed">
              Enriching accepted records against demographic markers, net-worth tiers, and propensity score models.
            </p>
          </div>

          <div className="w-full max-w-md h-2 bg-[#f0f0f3] rounded-full mx-auto overflow-hidden">
            <div className="bg-[#0071e3] h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          <div className="bg-[#1d1d1f] text-emerald-400 font-mono text-[11px] text-left p-4 rounded-[14px] max-w-lg mx-auto h-44 overflow-y-auto space-y-1.5">
            {logs.map((log, index) => (
              <div key={index} className="leading-relaxed opacity-90">{log}</div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <WizardHeader
            section="Lead Qualification"
            title={title}
            subtitle={subtitle}
            client={clientProfile}
            steps={STEPS}
            step={step}
            onCancel={onCancel}
            onJump={(n) => setStep(n)}
          />

          {isExistingCampaign && (
            <div className="flex items-center justify-between gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
                <Lock size={12} className="text-neutral-500" /> Locked Campaign Parameters
              </span>
            </div>
          )}

          {step === 1 && (
            <WizardCard title="Campaign basics" lead="Set your target first. We will check every audience file against it.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="lq-name" required>Campaign name</FieldLabel>
                    {isExistingCampaign && <LockedNote />}
                  </div>
                  <input
                    id="lq-name"
                    type="text"
                    value={campaignName}
                    disabled={isExistingCampaign}
                    onChange={(e) => {
                      setCampaignName(e.target.value);
                      setTouched((prev) => ({ ...prev, campaignName: true }));
                    }}
                    placeholder="e.g. Zenith Festive Tier-1 Qualification"
                    className={inputCls(touched.campaignName && !campaignName.trim())}
                  />
                  {touched.campaignName && !campaignName.trim() && (
                    <p className="text-[11px] font-medium text-rose-500">Campaign name is required.</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <FieldLabel required>Business line</FieldLabel>
                    {isExistingCampaign && <LockedNote />}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {clientProfile.businessLines.map((line: string) => (
                      <Chip
                        key={line}
                        on={businessLine === line}
                        disabled={isExistingCampaign}
                        onClick={() => {
                          if (!isExistingCampaign) {
                            setBusinessLine(line);
                            setTouched((prev) => ({ ...prev, businessLine: true }));
                          }
                        }}
                      >
                        {line}
                      </Chip>
                    ))}
                  </div>
                  {touched.businessLine && !businessLine && (
                    <p className="text-[11px] font-medium text-rose-500">Please select a business line.</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2 max-w-md">
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="lq-cqc" required>Target CQC</FieldLabel>
                    {isExistingCampaign && <LockedNote />}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-medium">₹</span>
                    <input
                      id="lq-cqc"
                      type="number"
                      disabled={isExistingCampaign}
                      value={targetCQC || ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                        setTargetCQC(val);
                        setTouched((prev) => ({ ...prev, targetCQC: true }));
                      }}
                      placeholder="18"
                      className={`${inputCls(touched.targetCQC && (!targetCQC || targetCQC <= 0))} pl-8`}
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400">Cost per Qualified Customer. What you are willing to pay to qualify one prospect. Last 30d avg: ₹18.</p>
                  {touched.targetCQC && (!targetCQC || targetCQC <= 0) && (
                    <p className="text-[11px] font-medium text-rose-500">Target CQC must be greater than ₹0.</p>
                  )}
                </div>
              </div>
            </WizardCard>
          )}

          {step === 2 && (
            <>
              <WizardCard
                title="Audience file"
                lead="Rows missing both email and phone are skipped individually, without rejecting the whole file."
              >
                <div className="flex flex-col gap-3">
                  <FieldLabel required>Upload Audience File</FieldLabel>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.xls,.xlsx"
                    onChange={handleNativeFileUpload}
                    className="hidden"
                  />

                  {!pendingFile ? (
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-8 text-center transition-colors hover:border-blue-500 hover:bg-blue-50/20"
                    >
                      <UploadCloud size={24} className="mx-auto mb-2 text-blue-600" />
                      <h4 className="text-xs font-bold text-neutral-800">Click or drag and drop your audience file</h4>
                      <p className="mt-0.5 text-[11px] text-neutral-400">CSV, XLS or XLSX · up to 25 MB</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg bg-neutral-50 border border-neutral-200/80 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet size={20} className="text-blue-600" />
                        <div>
                          <div className="text-xs font-bold text-neutral-900">{pendingFile.name}</div>
                          <div className="text-[11px] text-neutral-400 font-mono">{pendingFile.size}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPendingFile(null)}
                        className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-200/60 hover:text-neutral-700 transition-colors cursor-pointer"
                        title="Replace file"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {touched.file && !pendingFile && (
                    <p className="text-[11px] font-medium text-rose-500">Upload an audience file with at least one accepted row.</p>
                  )}
                </div>

                {pendingFile && (
                  <>
                    <div className="flex flex-col gap-3">
                      <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-400">Validation Breakdown</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Tile label="Accepted rows" value={pendingFile.rowsAccepted.toLocaleString('en-IN')} sub="Ready for qualification and scoring" />
                        <Tile label="Skipped rows" value={pendingFile.rowsSkipped.toLocaleString('en-IN')} />
                      </div>
                      <div className="rounded-lg border border-neutral-200/70 p-4 bg-white">
                        <div className="mb-2 text-xs font-bold text-neutral-800">Why rows were skipped</div>
                        <ul className="flex flex-col gap-1.5">
                          {pendingFile.skipReasons.map((r, idx) => (
                            <li key={idx} className="flex justify-between gap-4 text-xs text-neutral-600">
                              <span>{r.reason}</span>
                              <span className="font-mono font-semibold text-neutral-900">{r.count}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-400">Cost &amp; Target Check</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Tile label="Cost estimate (this file)" value={`₹${pendingFile.cost.toLocaleString('en-IN')}`} sub={`${pendingFile.rowsAccepted.toLocaleString('en-IN')} rows`} />
                        <Tile label="Running total spend" value={`₹${runningTotalSpend.toLocaleString('en-IN')}`} sub={isExistingCampaign ? 'Cumulative' : 'Initial file'} />
                        <Tile
                          label="Est. CQC vs target"
                          value={`₹${estCQC}`}
                          tone={isWithinTarget ? 'ok' : 'warn'}
                          sub={`Target ₹${targetCQC} · ${isWithinTarget ? 'within target' : 'above target'}. ~₹${estCQC} per prospect.`}
                        />
                      </div>
                    </div>
                  </>
                )}
              </WizardCard>

              <CollapsibleCard title="More Options" badge="Optional" isOpen={moreOptionsOpen} onToggle={() => setMoreOptionsOpen(!moreOptionsOpen)}>
                <div className="flex flex-col gap-1.5 max-w-xl">
                  <FieldLabel htmlFor="lq-notes">Internal notes / objective</FieldLabel>
                  <textarea
                    id="lq-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Record internal notes, qualification objectives, or source attribution..."
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-neutral-400"
                  />
                </div>
              </CollapsibleCard>
            </>
          )}

          {step === 3 && (
            <TopEmailsStep
              emails={emails}
              onChange={setEmails}
              lead="Pick five of your best customers. They help our model learn what a qualified prospect looks like, so scoring is more accurate."
              noteTail="not added to your audience file"
            />
          )}

          {step === 4 && (
            <ReviewConsentStep
              kind="qualification"
              actionWord="run"
              sections={reviewSections}
              acks={acks}
              onToggle={(i) => setAcks((prev) => prev.map((v, idx) => (idx === i ? !v : v)))}
              walletCost={{
                currentBalance: 850000,
                campaignCost: pendingFile ? pendingFile.cost : 0,
                costLabel: 'Qualification File Cost',
                costSubtext: `${pendingFile ? pendingFile.rowsAccepted.toLocaleString('en-IN') : 0} accepted rows · ~₹${estCQC || 16}/record qualification fee`,
                unitRateLabel: 'Est. CQC',
                unitRateValue: `Est. CQC: ₹${estCQC || targetCQC || 16}`,
                pacingNote: `${pendingFile ? pendingFile.name : 'Audience roster'} (${pendingFile?.size || '0 KB'})`
              }}
            />
          )}

          {step < 4 ? (
            <WizardFooter
              step={step}
              onBack={goBack}
              onNext={handleNext}
              nextLabel="Continue"
              nextDisabled={nextDisabled}
            />
          ) : (
            <div className="flex items-center justify-between pt-4 border-t border-neutral-200/70 mt-4">
              <button 
                type="button" 
                onClick={goBack} 
                className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Back
              </button>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-neutral-400 font-medium">Step 4 of 4</span>
                {isExistingCampaign && selectedCampaign && (
                  <button
                    type="button"
                    onClick={() => onClone(selectedCampaign)}
                    className="h-9 sm:h-10 px-4 text-xs font-semibold bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy size={13} /> Clone campaign
                  </button>
                )}
                <button
                  type="button"
                  id="run_qualification_campaign_btn"
                  disabled={!canRun}
                  onClick={handleRunClick}
                  className="h-9 sm:h-10 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                >
                  <span>Run qualification</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
