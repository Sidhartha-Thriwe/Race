import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  UploadCloud, 
  FileText, 
  ShieldCheck, 
  Copy, 
  Check, 
  AlertTriangle,
  Info,
  Activity,
  X,
  Sparkles,
  Lock,
  FileSpreadsheet,
  PlayCircle,
  Tag
} from 'lucide-react';
import { QualCampaign, QualFile } from './LeadQualification';
import {
  WizardHeader, WizardCard, WizardFooter, TopEmailsStep, ReviewConsentStep,
  buildConsent, emailsComplete, cleanEmails, FieldLabel, inputCls, Chip
} from './campaign-builder/wizard';

const STEPS = ['Basics', 'Audience file', 'Top 5 emails', 'Review & consent'];

interface CustomerInsightBuilderProps {
  selectedCampaign: QualCampaign | null;
  onCancel: () => void;
  onRun: (campaignData: Partial<QualCampaign> & { fileToRun: Omit<QualFile, 'id'> }) => void;
  onClone: (campaign: QualCampaign) => void;
}

const InfoTooltip: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="group relative inline-flex items-center ml-1.5 text-neutral-400 hover:text-neutral-600 transition-colors cursor-help align-middle">
      <Info size={13} className="inline-block" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block w-64 p-2.5 bg-neutral-900 text-white text-[11px] leading-relaxed rounded-lg shadow-xl font-medium border border-neutral-800 z-[999] text-center pointer-events-none transition-all duration-150">
        <div className="relative">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-neutral-900 border-r border-b border-neutral-800 rotate-45 mt-[3.5px]" />
        </div>
      </div>
    </div>
  );
};

const INDUSTRY_BUSINESS_LINES_MAP: Record<string, string[]> = {
  'Automobile': ['New Sale', 'Resale', 'Services', 'Parts'],
  'Real Estate': ['New Launch', 'Resale', 'Rentals / Leasing', 'Commercial'],
  'Luxury Watches': ['New Watches', 'Pre-owned', 'Servicing & Repairs', 'Accessories'],
  'Wealth Management': ['Wealth Advisory', 'Portfolio Management', 'Private Banking', 'Structured Products'],
  'Financial Services': ['Wealth Advisory', 'Mutual Funds', 'Credit Cards', 'Insurance', 'Legacy Trust'],
  'Technology': ['Enterprise Software', 'Cloud Services', 'Hardware Solutions', 'Consulting'],
  'Healthcare': ['Clinical Services', 'Diagnostics', 'Preventive Care', 'Specialty Treatments']
};

const SAMPLE_PROSPECTS = [
  {
    id: "SAMP-001",
    name: "Suresh Nair",
    location: "Mumbai",
    role: "VP Wealth Operations",
    company: "Aditya Birla Finance",
    dataQuality: "High Confidence",
    personaSummary: "Conservative Yield Optimizer seeking high transparency, automated liquidity triggers, and downside capital protection. Values physical advisory touchpoints but expects instant mobile check-ins.",
    topCategories: [
      {
        rank: 1,
        name: "Capital-Protected Yield PMS",
        evidenceStrength: 9.2,
        psychFit: 9.5,
        rationale: "Requires stable yields to support active portfolio restructuring; highly risk-averse."
      },
      {
        rank: 2,
        name: "Sovereign Gold Bond Aggregators",
        evidenceStrength: 8.4,
        psychFit: 8.9,
        rationale: "Motivated by security and inflation-hedged wealth preservation."
      }
    ]
  },
  {
    id: "SAMP-002",
    name: "Aditi Deshmukh",
    location: "Pune",
    role: "Co-Founder",
    company: "CyberShield Solutions",
    dataQuality: "High Confidence",
    personaSummary: "Aggressive Equity Compounding Maven focused on early-stage disruptors and tech-driven global indices. Autonomous transaction style, high-tech affinity.",
    topCategories: [
      {
        rank: 1,
        name: "Global Technology PMS",
        evidenceStrength: 9.6,
        psychFit: 9.8,
        rationale: "Strong conviction in deep-tech and AI disruption as the prime wealth multiplier."
      },
      {
        rank: 2,
        name: "Venture Capital Feeder Funds",
        evidenceStrength: 8.9,
        psychFit: 9.2,
        rationale: "Eager to back high-potential startups; matches her entrepreneurial background."
      }
    ]
  },
  {
    id: "SAMP-003",
    name: "Dr. Rohan Sen",
    location: "Kolkata",
    role: "Chief of Cardiology",
    company: "Apollo Health",
    dataQuality: "Medium Confidence",
    personaSummary: "Busy High-Earning Professional with zero time for active trading. Seeks hands-off, ultra-convenient premium wealth management and real estate asset classes.",
    topCategories: [
      {
        rank: 1,
        name: "Private Wealth Discretionary Advisory",
        evidenceStrength: 9.4,
        psychFit: 9.6,
        rationale: "Requires completely outsourced, high-touch estate and trust advisory."
      },
      {
        rank: 2,
        name: "Grade-A Commercial Real Estate REITs",
        evidenceStrength: 8.8,
        psychFit: 9.1,
        rationale: "Appreciates rental-yielding hard assets with zero direct management hassle."
      }
    ]
  },
  {
    id: "SAMP-004",
    name: "Vikram Rathore",
    location: "Jaipur",
    role: "Managing Partner",
    company: "Rathore & Sons",
    dataQuality: "High Confidence",
    personaSummary: "Legacy-Minded Wealth Preservationist focused on intergenerational trust setups and low-volatility fixed-income instruments. High brand loyalty and community trust.",
    topCategories: [
      {
        rank: 1,
        name: "Trust & Estate Advisory Services",
        evidenceStrength: 9.5,
        psychFit: 9.7,
        rationale: "Primary focus on securing tax-friendly transition to next-generation leadership."
      },
      {
        rank: 2,
        name: "Secured Corporate NCD Funds",
        evidenceStrength: 8.6,
        psychFit: 8.8,
        rationale: "Enjoys predictable, fixed coupons from heritage conglomerates."
      }
    ]
  },
  {
    id: "SAMP-005",
    name: "Kavita Krishnamurthy",
    location: "Bengaluru",
    role: "Head of Product",
    company: "SaaSify Inc",
    dataQuality: "Medium Confidence",
    personaSummary: "Millennial HNI Investor aiming for ESG-centric and climate-resilient thematic options. Extremely digital-first, expects visual sustainability reports.",
    topCategories: [
      {
        rank: 1,
        name: "Sustainable & ESG PMS",
        evidenceStrength: 9.3,
        psychFit: 9.5,
        rationale: "Strong preference for green energy, electric mobility, and clean-tech leaders."
      },
      {
        rank: 2,
        name: "Global Green Energy Feeder Funds",
        evidenceStrength: 8.7,
        psychFit: 9.0,
        rationale: "Motivated by direct social and environmental impact metrics."
      }
    ]
  }
];

export const CustomerInsightBuilder: React.FC<CustomerInsightBuilderProps> = ({
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

  // Determine if this is an existing campaign with locked parameters
  const isExistingCampaign = Boolean(selectedCampaign && (selectedCampaign.hasRunFirstFile || (selectedCampaign.files && selectedCampaign.files.length > 0)));

  // Form State
  const [campaignName, setCampaignName] = useState<string>('');
  const [targetCIC, setTargetCIC] = useState<number>(15);
  const [useCaseTag, setUseCaseTag] = useState<'Engagement' | 'Retention' | 'General Insight'>('Engagement');
  const [businessLine, setBusinessLine] = useState<string>('');
  
  // Advanced settings (collapsible, closed by default)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [totalBudgetCap, setTotalBudgetCap] = useState<number | ''>('');
  const [notes, setNotes] = useState<string>('');

  // File upload & validation state
  const [pendingFile, setPendingFile] = useState<{
    name: string;
    size: string;
    rowsAccepted: number;
    rowsSkipped: number;
    skipReasons: Array<{ count: number; reason: string }>;
    flatCost: number;
  } | null>(null);

  // Sample Scoring Flow States
  const [hasRunSample, setHasRunSample] = useState<boolean>(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState<boolean>(false);
  const [isSimulatingSampleRun, setIsSimulatingSampleRun] = useState<boolean>(false);
  const [sampleProgress, setSampleProgress] = useState<number>(0);
  const [sampleActualPerRowCost] = useState<number>(11.40); // Empirical per-row cost from 5 samples
  const [sampleHighConfidenceCost] = useState<number>(19.00); // 3 of 5 are High Confidence => (5 * 11.40)/3 = ₹19.00

  const [step, setStep] = useState<number>(1);
  const [emails, setEmails] = useState<string[]>(['', '', '', '', '']);
  const [acks, setAcks] = useState<boolean[]>([false, false, false, false]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Full processing simulation state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or hydrate form
  useEffect(() => {
    if (selectedCampaign) {
      setCampaignName(selectedCampaign.name);
      setTargetCIC((selectedCampaign as any).targetCIC || selectedCampaign.targetCostPerQualifiedLead || 15);
      setUseCaseTag((selectedCampaign.useCaseTag === 'Lead Gen' ? 'Engagement' : selectedCampaign.useCaseTag) as any || 'Engagement');
      setBusinessLine(selectedCampaign.businessLine || selectedCampaign.targetProduct || clientProfile.businessLines[0] || 'New Sale');
      setTotalBudgetCap(selectedCampaign.totalBudgetCap || '');
      setNotes(selectedCampaign.notes || '');
    } else {
      setCampaignName('Zenith HNI Persona & Insight Mapping');
      setTargetCIC(15);
      setUseCaseTag('Engagement');
      setBusinessLine(clientProfile.businessLines[0] || 'New Sale');
      setTotalBudgetCap('');
      setNotes('');
    }
    setPendingFile(null);
    setHasRunSample(false);
    setStep(1);
    setEmails(['', '', '', '', '']);
    setAcks([false, false, false, false]);
  }, [selectedCampaign, clientProfile]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Format currency helper
  const formatTicketSize = (amt: number) => {
    if (amt >= 10000000) {
      return `₹${(amt / 10000000).toFixed(amt % 10000000 === 0 ? 0 : 1)} Cr`;
    }
    if (amt >= 100000) {
      return `₹${(amt / 100000).toFixed(amt % 100000 === 0 ? 0 : 1)}L`;
    }
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  // Simulate file load and validation
  const simulateFileLoad = (fileName: string, fileSize: string) => {
    const accepted = Math.floor(Math.random() * 800 + 1200); // 1200 - 2000 accepted
    const missingContactSkipped = Math.floor(Math.random() * 22 + 10);
    const optOutSkipped = Math.floor(Math.random() * 16 + 6);
    const duplicateSkipped = Math.floor(Math.random() * 10 + 4);
    const totalSkipped = missingContactSkipped + optOutSkipped + duplicateSkipped;
    
    // Flat estimate: ₹12.50 per accepted customer record
    const flatCost = Math.round(accepted * 12.50);

    setPendingFile({
      name: fileName,
      size: fileSize,
      rowsAccepted: accepted,
      rowsSkipped: totalSkipped,
      skipReasons: [
        { count: missingContactSkipped, reason: "Missing both email ID and phone number (skipped individually)" },
        { count: optOutSkipped, reason: "National DND / internal profiling opt-out list match" },
        { count: duplicateSkipped, reason: "Duplicate customer record matched in active insight ledger" }
      ],
      flatCost
    });
    setHasRunSample(false);
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
      simulateFileLoad("customer_crm_insight_roster.xlsx", "2.40 MB");
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

  // Cost calculations
  const effectiveFileCost = useMemo(() => {
    if (!pendingFile) return 0;
    if (hasRunSample) {
      return Math.round(pendingFile.rowsAccepted * sampleActualPerRowCost);
    }
    return pendingFile.flatCost;
  }, [pendingFile, hasRunSample, sampleActualPerRowCost]);

  // Est. CIC Calculation
  const estCIC = useMemo(() => {
    if (!pendingFile || pendingFile.rowsAccepted === 0) return 0;
    if (hasRunSample) {
      return sampleActualPerRowCost;
    }
    return Number((pendingFile.flatCost / pendingFile.rowsAccepted).toFixed(2));
  }, [pendingFile, hasRunSample, sampleActualPerRowCost]);

  const isWithinTarget = useMemo(() => {
    if (!pendingFile || estCIC === 0) return true;
    return estCIC <= targetCIC;
  }, [estCIC, targetCIC, pendingFile]);

  // Prior and Running Total Spend
  const priorTotalSpend = useMemo(() => {
    if (selectedCampaign && selectedCampaign.totalSpend) {
      return selectedCampaign.totalSpend;
    }
    return 0;
  }, [selectedCampaign]);

  const runningTotalSpend = useMemo(() => {
    return priorTotalSpend + effectiveFileCost;
  }, [priorTotalSpend, effectiveFileCost]);

  // Trigger Sample scoring popup flow
  const handleOpenSampleModal = () => {
    if (!pendingFile) return;
    setIsSampleModalOpen(true);
    setIsSimulatingSampleRun(true);
    setSampleProgress(0);

    const interval = setInterval(() => {
      setSampleProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulatingSampleRun(false);
          return 100;
        }
        return prev + 25;
      });
    }, 350);
  };

  const handleConfirmSampleModal = () => {
    setHasRunSample(true);
    setIsSampleModalOpen(false);
  };

  // Validation
  const isBudgetCapValid = totalBudgetCap === '' || Number(totalBudgetCap) > 0;

  const isFormValid = useMemo(() => {
    if (!campaignName.trim()) return false;
    if (!targetCIC || targetCIC <= 0) return false;
    if (!useCaseTag) return false;
    if (!businessLine) return false;
    if (!pendingFile || pendingFile.rowsAccepted <= 0) return false;
    if (!emailsComplete(emails)) return false;
    if (!isBudgetCapValid) return false;
    return true;
  }, [campaignName, targetCIC, useCaseTag, businessLine, pendingFile, emails, isBudgetCapValid]);

  const step1Valid = Boolean(campaignName.trim()) && targetCIC > 0 && Boolean(useCaseTag) && Boolean(businessLine);
  const step2Valid = Boolean(pendingFile && pendingFile.rowsAccepted > 0) && isBudgetCapValid;
  const canRun = acks.every(Boolean) && isFormValid;

  // Run full file execution
  const handleRunClick = () => {
    setTouched({
      campaignName: true,
      targetCIC: true,
      useCaseTag: true,
      businessLine: true,
      file: true,
      budgetCap: true
    });

    if (!isFormValid || !pendingFile) return;

    setIsProcessing(true);
    setProgress(0);
    setLogs([]);

    const logSteps = [
      `[INIT] Validated audience file: ${pendingFile.name} (${pendingFile.size})`,
      `[USE CASE] Tag: [${useCaseTag}] | Target CIC: ₹${targetCIC} | Est. CIC: ₹${estCIC} (${hasRunSample ? 'Empirical Sample' : 'Flat Estimate'})`,
      `[BUSINESS CONTEXT] ${clientProfile.industry} • ${businessLine}`,
      `[COMPLIANCE] Verified behavioral & psychological profiling consent authorization`,
      `[AI GRAPH] Triggering psychographic propensity & wealth scoring matrix...`,
      `[FILTER] Filtered out ${pendingFile.rowsSkipped} rows matching opt-out / incomplete contact coords`,
      `[PERSONA] Generating High & Medium confidence persona clusters...`,
      `[SUCCESS] 100% processed. ${pendingFile.rowsAccepted} customer profiles scored & enriched!`
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
            topEmails: cleanEmails(emails),
            consent: buildConsent('insight'),
            name: campaignName.trim(),
            useCaseTag: useCaseTag,
            industry: clientProfile.industry,
            targetProduct: businessLine,
            businessLine: businessLine,
            targetCQC: targetCIC,
            targetCostPerQualifiedLead: targetCIC,
            totalBudgetCap: totalBudgetCap,
            notes: notes.trim(),
            fileToRun: {
              fileName: pendingFile.name,
              fileSize: pendingFile.size,
              rowsAccepted: pendingFile.rowsAccepted,
              rowsSkipped: pendingFile.rowsSkipped,
              skipReasons: pendingFile.skipReasons,
              cost: effectiveFileCost,
              dateUploaded: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              status: 'Completed'
            }
          });
          setIsProcessing(false);
        }, 700);
      }
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans select-none" id="customer-insight-builder-container">
      
      {/* Processing Loading Screen */}
      {isProcessing ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 sm:p-12 shadow-sm text-center space-y-6 max-w-2xl mx-auto my-8">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-blue-50 rounded-full border border-blue-100">
            <Activity className="text-blue-600 animate-pulse" size={28} />
            <span className="absolute text-[10px] font-black text-blue-800">{progress}%</span>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-neutral-900">Profiling Customers & Generating Psychographic Personas...</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
              Applying proprietary intent scoring and category propensity graphs to your customer cohort.
            </p>
          </div>

          <div className="w-full max-w-md h-2 bg-neutral-100 rounded-full mx-auto overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="bg-neutral-900 text-emerald-400 font-mono text-[11px] text-left p-4 rounded-xl max-w-lg mx-auto h-44 overflow-y-auto space-y-1.5 shadow-inner border border-neutral-800">
            {logs.map((log, index) => (
              <div key={index} className="leading-relaxed opacity-90">
                {log}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <WizardHeader
            section="Customer Insight"
            title={isExistingCampaign ? `Manage Campaign: ${selectedCampaign?.name}` : 'Create Customer Insight Campaign'}
            subtitle={isExistingCampaign
              ? "Upload another audience file under this campaign's fixed Target CIC, Use-case and Business line."
              : 'Target-first customer intelligence setup powered by your verified client profile.'}
            client={clientProfile}
            steps={STEPS}
            step={step}
            onCancel={onCancel}
            onJump={(n) => setStep(n)}
          />

          {isExistingCampaign && selectedCampaign && (
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f0f3] px-3 py-1 text-xs font-medium text-[#6e6e73]">
                <Lock size={11} /> Locked Campaign
              </span>
              <button
                type="button"
                onClick={() => onClone(selectedCampaign)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#e8e8ed] px-5 text-sm font-medium text-[#1d1d1f] hover:bg-[#dcdce1]"
              >
                <Copy size={13} /> Clone Campaign
              </button>
            </div>
          )}

          {/* STEP 1: BASICS */}
          {step === 1 && (
            <WizardCard title="Basics" lead="Name your campaign, set the cost you are willing to pay per insight and choose what it is for.">
              <div className="flex max-w-[640px] flex-col gap-7">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="ci-name" required>Campaign name</FieldLabel>
                    {isExistingCampaign && <span className="inline-flex items-center gap-1 text-xs text-[#86868b]"><Lock size={10} /> Fixed in existing campaign</span>}
                  </div>
                  <input
                    id="ci-name"
                    type="text"
                    value={campaignName}
                    disabled={isExistingCampaign}
                    onChange={(e) => { setCampaignName(e.target.value); setTouched(prev => ({ ...prev, campaignName: true })); }}
                    placeholder="e.g. Zenith HNI Persona & Insight Mapping"
                    className={inputCls(touched.campaignName && !campaignName.trim())}
                  />
                  {touched.campaignName && !campaignName.trim() && <p className="text-[13px] text-[#d70015]">Campaign name is required.</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="ci-target" required>Target CIC</FieldLabel>
                    {isExistingCampaign && <span className="inline-flex items-center gap-1 text-xs text-[#86868b]"><Lock size={10} /> Fixed in existing campaign</span>}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-[#6e6e73]">₹</span>
                    <input
                      id="ci-target"
                      type="number"
                      disabled={isExistingCampaign}
                      value={targetCIC || ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                        setTargetCIC(val);
                        setTouched(prev => ({ ...prev, targetCIC: true }));
                      }}
                      placeholder="15"
                      className={`${inputCls(touched.targetCIC && (!targetCIC || targetCIC <= 0))} pl-9`}
                    />
                  </div>
                  <p className="text-[13px] text-[#6e6e73]">Cost per Customer Insight. What you are willing to pay to profile one customer. Your last 30 days average: ₹15.</p>
                  {touched.targetCIC && (!targetCIC || targetCIC <= 0) && <p className="text-[13px] text-[#d70015]">Target CIC must be greater than ₹0.</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <FieldLabel required>Use-case tag</FieldLabel>
                    {isExistingCampaign && <span className="inline-flex items-center gap-1 text-xs text-[#86868b]"><Lock size={10} /> Fixed in existing campaign</span>}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {(['Engagement', 'Retention', 'General Insight'] as const).map((tag) => {
                      const on = useCaseTag === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          aria-pressed={on}
                          disabled={isExistingCampaign}
                          onClick={() => { if (!isExistingCampaign) { setUseCaseTag(tag); setTouched(prev => ({ ...prev, useCaseTag: true })); } }}
                          className={`flex h-16 items-center justify-center gap-2 rounded-[14px] border text-[15px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${on ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white' : 'border-[#d2d2d7] bg-white text-[#1d1d1f] hover:border-[#86868b]'}`}
                        >
                          {on && <Check size={14} className="stroke-[3]" />}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[13px] text-[#6e6e73]">Calibrates the persona and propensity scoring. Affects internal scoring only. Locked after the first run; clone the campaign to change it.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <FieldLabel required>Business line</FieldLabel>
                    {isExistingCampaign && <span className="inline-flex items-center gap-1 text-xs text-[#86868b]"><Lock size={10} /> Fixed in existing campaign</span>}
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {clientProfile.businessLines.map((line: string) => (
                      <Chip
                        key={line}
                        on={businessLine === line}
                        disabled={isExistingCampaign}
                        onClick={() => { if (!isExistingCampaign) { setBusinessLine(line); setTouched(prev => ({ ...prev, businessLine: true })); } }}
                      >
                        {line}
                      </Chip>
                    ))}
                  </div>
                  {touched.businessLine && !businessLine && <p className="text-[13px] text-[#d70015]">Please select a business line.</p>}
                </div>
              </div>
            </WizardCard>
          )}

          {/* STEP 2: AUDIENCE FILE */}
          {step === 2 && (
            <>
              <WizardCard title="Audience file" lead="Upload the customers you want profiled.">
                <div className="flex flex-col gap-3">
                  <FieldLabel required>Upload Audience File</FieldLabel>
                  <input type="file" ref={fileInputRef} accept=".csv,.xls,.xlsx" onChange={handleNativeFileUpload} className="hidden" />

                  {!pendingFile ? (
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer rounded-[16px] border-2 border-dashed border-[#d2d2d7] bg-[#fafafc] p-10 text-center transition-colors hover:border-[#0071e3]"
                    >
                      <UploadCloud size={28} className="mx-auto mb-3 text-[#0071e3]" />
                      <h4 className="text-[15px] font-semibold text-[#1d1d1f]">Click or drag and drop your customer audience file</h4>
                      <p className="mt-1 text-[13px] text-[#6e6e73]">CSV, XLS or XLSX, up to 25 MB</p>
                      <p className="mt-3 text-[13px] text-[#6e6e73]">A row missing both email and phone is skipped on its own; the rest of the file is kept.</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-[14px] bg-[#f5f5f7] px-5 py-4">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet size={22} className="text-[#0071e3]" />
                        <div>
                          <div className="text-[15px] font-medium text-[#1d1d1f]">{pendingFile.name}</div>
                          <div className="text-[13px] text-[#6e6e73]">{pendingFile.size}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        title="Replace file"
                        onClick={() => { setPendingFile(null); setHasRunSample(false); }}
                        className="rounded-full p-2 text-[#6e6e73] hover:bg-[#e8e8ed] hover:text-[#1d1d1f]"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {pendingFile && (
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#6e6e73]">Validation</h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-[14px] bg-[#f5f5f7] p-5">
                        <div className="text-[13px] text-[#6e6e73]">Accepted rows</div>
                        <div className="mt-1 text-[28px] font-semibold tracking-tight text-[#1d1d1f]">{pendingFile.rowsAccepted.toLocaleString('en-IN')}</div>
                        <div className="text-[13px] text-[#6e6e73]">Ready for customer insight profiling</div>
                      </div>
                      <div className="rounded-[14px] bg-[#f5f5f7] p-5">
                        <div className="text-[13px] text-[#6e6e73]">Skipped rows</div>
                        <div className="mt-1 text-[28px] font-semibold tracking-tight text-[#1d1d1f]">{pendingFile.rowsSkipped.toLocaleString('en-IN')}</div>
                        <div className="text-[13px] text-[#6e6e73]">Not charged</div>
                      </div>
                    </div>
                    <div className="rounded-[14px] border border-[#e5e5ea] p-5">
                      <h5 className="mb-2 text-sm font-semibold text-[#1d1d1f]">Why rows were skipped</h5>
                      <div className="flex flex-col gap-1.5">
                        {pendingFile.skipReasons.map((reason, idx) => (
                          <div key={idx} className="flex items-start justify-between gap-4 text-[14px] text-[#6e6e73]">
                            <span>{reason.reason}</span>
                            <span className="flex-none font-medium text-[#1d1d1f]">{reason.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </WizardCard>

              {pendingFile && (
                <>
                  <WizardCard title="Scoring sample">
                    <div className="-mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="max-w-[520px] space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#f0f0f3] px-2.5 py-[3px] text-xs font-medium text-[#6e6e73]">Optional · free</span>
                          {hasRunSample && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5ec] px-2.5 py-[3px] text-xs font-medium text-[#1d7a3a]">
                              <Check size={11} className="stroke-[3]" /> Sample completed
                            </span>
                          )}
                        </div>
                        <p className="text-[15px] leading-relaxed text-[#6e6e73]">A free test pass on 5 real prospects. It works out your real cost per insight and shows a persona preview before you commit.</p>
                        <p className="text-[13px] text-[#86868b]">Does not charge your account balance. You can run the campaign without it.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenSampleModal}
                        className="inline-flex h-12 flex-none items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-7 text-base font-medium text-white hover:bg-black"
                      >
                        <PlayCircle size={16} />
                        {hasRunSample ? 'Re-run sample scoring' : 'Run scoring sample'}
                      </button>
                    </div>
                  </WizardCard>

                  <WizardCard title="Cost & target check">
                    <div className="-mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-[14px] bg-[#f5f5f7] p-5">
                        <div className="text-[13px] text-[#6e6e73]">Cost estimate (this file)</div>
                        <div className="mt-1 text-[26px] font-semibold tracking-tight text-[#1d1d1f]">₹{effectiveFileCost.toLocaleString('en-IN')}</div>
                        <div className="text-[13px] text-[#6e6e73]">{hasRunSample ? 'Based on sample' : 'Flat rate until a sample is run'}</div>
                      </div>
                      <div className="rounded-[14px] bg-[#f5f5f7] p-5">
                        <div className="text-[13px] text-[#6e6e73]">Running total spend</div>
                        <div className="mt-1 text-[26px] font-semibold tracking-tight text-[#1d1d1f]">₹{runningTotalSpend.toLocaleString('en-IN')}</div>
                        <div className="text-[13px] text-[#6e6e73]">{isExistingCampaign ? 'Cumulative' : 'Initial file'}</div>
                      </div>
                      <div className="rounded-[14px] bg-[#f5f5f7] p-5">
                        <div className="text-[13px] text-[#6e6e73]">Est. CIC vs target</div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-[26px] font-semibold tracking-tight text-[#1d1d1f]">₹{estCIC}</span>
                          <span className="text-[13px] text-[#6e6e73]">Target ₹{targetCIC}</span>
                        </div>
                        <div className={`inline-flex items-center gap-1 text-[13px] font-medium ${isWithinTarget ? 'text-[#1d7a3a]' : 'text-[#b25000]'}`}>
                          {isWithinTarget ? <Check size={12} className="stroke-[3]" /> : <AlertTriangle size={12} />}
                          {isWithinTarget ? 'Within target' : 'Above target'}{hasRunSample ? ' · based on sample' : ''}
                        </div>
                      </div>
                    </div>
                  </WizardCard>
                </>
              )}

              <WizardCard>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-[22px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">More options</h3>
                  <span className="rounded-full bg-[#f0f0f3] px-2.5 py-[3px] text-xs font-medium text-[#6e6e73]">Optional</span>
                </div>
                <div className="flex max-w-[640px] flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="ci-cap">Total budget cap (₹)</FieldLabel>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-[#6e6e73]">₹</span>
                      <input
                        id="ci-cap"
                        type="number"
                        min="1"
                        step="1000"
                        value={totalBudgetCap}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10));
                          setTotalBudgetCap(val);
                          setTouched(prev => ({ ...prev, budgetCap: true }));
                        }}
                        placeholder="e.g. 50000"
                        className={`${inputCls(touched.budgetCap && totalBudgetCap !== '' && Number(totalBudgetCap) <= 0)} pl-9`}
                      />
                    </div>
                    <p className="text-[13px] text-[#6e6e73]">A hard spend ceiling. The campaign stops once it is reached, however many files are added later.</p>
                    {touched.budgetCap && totalBudgetCap !== '' && Number(totalBudgetCap) <= 0 && (
                      <p className="text-[13px] text-[#d70015]">Total budget cap must be greater than ₹0.</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="ci-notes">Internal notes / objective</FieldLabel>
                    <textarea
                      id="ci-notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Record internal notes, campaign objective, or team attribution..."
                      className="w-full rounded-xl border border-[#d2d2d7] bg-white px-4 py-3 text-base text-[#1d1d1f] outline-none focus:border-[#0071e3]"
                    />
                  </div>
                </div>
              </WizardCard>
            </>
          )}

          {/* STEP 3: TOP 5 EMAILS */}
          {step === 3 && (
            <TopEmailsStep
              emails={emails}
              onChange={setEmails}
              lead="Pick five of your best customers. They help our model learn what your customers look like, so personas and insights are more accurate."
              noteTail="not added to your audience file"
            />
          )}

          {/* STEP 4: REVIEW & CONSENT */}
          {step === 4 && (
            <ReviewConsentStep
              kind="insight"
              actionWord="run"
              acks={acks}
              onToggle={(i) => setAcks(prev => prev.map((v, idx) => (idx === i ? !v : v)))}
              sections={[
                { heading: 'Basics', rows: [
                  ['Campaign name', campaignName.trim() || '-'],
                  ['Target CIC', `₹${targetCIC}`],
                  ['Use-case tag', useCaseTag],
                  ['Business line', businessLine || '-'],
                ] },
                { heading: 'Audience file', rows: [
                  ['File', pendingFile ? pendingFile.name : '-'],
                  ['Rows', pendingFile ? pendingFile.rowsAccepted.toLocaleString('en-IN') : '-'],
                  ['Scoring sample', hasRunSample ? 'Run' : 'Not run'],
                  ['Cost estimate', `₹${effectiveFileCost.toLocaleString('en-IN')}`],
                  ['Est. CIC vs target', `₹${estCIC} vs ₹${targetCIC}`],
                  ['Total budget cap', totalBudgetCap !== '' ? `₹${Number(totalBudgetCap).toLocaleString('en-IN')}` : 'None'],
                  ['Internal notes', notes.trim() || 'None'],
                ] },
                { heading: 'Top 5 emails', rows: [
                  ['Emails', `${Math.min(cleanEmails(emails).length, 5)} of 5 added`],
                ] },
              ]}
            />
          )}

          {/* FOOTER */}
          {step === 4 && isExistingCampaign && selectedCampaign ? (
            <div className="mt-2 flex items-center justify-between">
              <button type="button" onClick={() => setStep(3)} className="px-2 text-base font-medium text-[#0071e3] hover:opacity-80">Back</button>
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-[#6e6e73]">Step 4 of 4</span>
                <button
                  type="button"
                  onClick={() => onClone(selectedCampaign)}
                  className="inline-flex h-12 items-center gap-1.5 rounded-full bg-[#e8e8ed] px-7 text-base font-medium text-[#1d1d1f]"
                >
                  <Copy size={14} /> Clone campaign
                </button>
                <button
                  type="button"
                  id="run_customer_insight_campaign_btn"
                  onClick={handleRunClick}
                  disabled={!canRun}
                  className="h-12 rounded-full bg-[#0071e3] px-7 text-base font-medium text-white transition-colors hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:bg-[#b9d7f7]"
                >
                  Run customer insight
                </button>
              </div>
            </div>
          ) : (
            <WizardFooter
              step={step}
              onBack={() => (step === 1 ? onCancel() : setStep(step - 1))}
              onNext={step === 4 ? handleRunClick : () => setStep(step + 1)}
              nextLabel={step === 4 ? 'Run customer insight' : 'Continue'}
              nextDisabled={step === 1 ? !step1Valid : step === 2 ? !step2Valid : step === 3 ? !emailsComplete(emails) : !canRun}
            />
          )}
        </>
      )}

      {/* SAMPLE SCORING MODAL */}
      {isSampleModalOpen && pendingFile && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Customer Insight Scoring Sample (5 Prospects)</h3>
                  <p className="text-xs text-neutral-500 font-medium">Free empirical scoring verification on 5 actual prospect records</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSampleModalOpen(false)}
                className="p-1.5 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {isSimulatingSampleRun ? (
                <div className="py-16 text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center bg-blue-50 rounded-full border border-blue-100">
                    <Activity className="text-blue-600 animate-pulse" size={24} />
                    <span className="absolute text-[9px] font-black text-blue-800">{sampleProgress}%</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-neutral-900">Extracting 5 Records & Synthesizing Personas...</h4>
                    <p className="text-[11px] text-neutral-500">Evaluating psychographic propensity against sector attributes.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Summary & Metrics Strip with NEW LINES */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Sample Size</span>
                      <strong className="text-sm font-extrabold text-neutral-900">5 Prospects (Free)</strong>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">3 High / 2 Medium Conf</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Estimated Full-File Cost</span>
                      <strong className="text-sm font-extrabold text-neutral-900">
                        ₹{Math.round(pendingFile.rowsAccepted * sampleActualPerRowCost).toLocaleString('en-IN')}
                      </strong>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">₹{sampleActualPerRowCost.toFixed(2)}/row empirical</span>
                    </div>

                    {/* NEW: Sample CIC vs Target */}
                    <div className={`p-2.5 rounded-lg border ${
                      sampleActualPerRowCost <= targetCIC 
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                        : 'bg-amber-50/70 border-amber-200 text-amber-950'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] uppercase font-bold text-neutral-600 block">Sample CIC vs Target</span>
                        {sampleActualPerRowCost <= targetCIC ? (
                          <Check size={12} className="text-emerald-700 stroke-[3]" />
                        ) : (
                          <AlertTriangle size={12} className="text-amber-700 stroke-[3]" />
                        )}
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <strong className="text-sm font-black">₹{sampleActualPerRowCost.toFixed(2)}</strong>
                        <span className="text-[10px] font-semibold text-neutral-600">(Target: ₹{targetCIC})</span>
                      </div>
                      <span className={`text-[9.5px] font-bold block ${
                        sampleActualPerRowCost <= targetCIC ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {sampleActualPerRowCost <= targetCIC ? 'Within target' : 'Exceeds target'}
                      </span>
                    </div>

                    {/* NEW: Sample cost per High Confidence insight */}
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-950">
                      <span className="text-[9.5px] uppercase font-bold text-blue-700 block">Cost / High Confidence</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <strong className="text-sm font-black text-blue-900">₹{sampleHighConfidenceCost.toFixed(2)}</strong>
                      </div>
                      <span className="text-[9.5px] font-semibold text-blue-700 block">
                        Derived from sample yield
                      </span>
                    </div>
                  </div>

                  {/* Sample Persona Cards */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Sample Generated Profiles (First 5 Rows)
                    </h4>

                    <div className="space-y-3">
                      {SAMPLE_PROSPECTS.map((prospect) => (
                        <div key={prospect.id} className="border border-neutral-200 rounded-xl p-4 hover:border-blue-300 bg-white transition-all space-y-3 shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-700 font-bold text-xs flex items-center justify-center">
                                {prospect.name.charAt(0)}
                              </div>
                              <div>
                                <span className="text-xs font-bold text-neutral-900">{prospect.name}</span>
                                <span className="text-[10.5px] text-neutral-400 font-medium ml-2">
                                  {prospect.role} • {prospect.company} ({prospect.location})
                                </span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              prospect.dataQuality === 'High Confidence'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}>
                              {prospect.dataQuality}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-600 leading-relaxed font-medium bg-neutral-50 p-2.5 rounded-lg border border-neutral-150">
                            "{prospect.personaSummary}"
                          </p>

                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold uppercase text-neutral-400">Top Matched Product Categories:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {prospect.topCategories.map((cat, i) => (
                                <div key={i} className="p-2 bg-white border border-neutral-200 rounded-lg text-xs space-y-0.5">
                                  <div className="flex items-center justify-between font-bold text-neutral-800">
                                    <span>#{cat.rank} {cat.name}</span>
                                    <span className="text-blue-600 font-mono text-[11px]">{cat.psychFit}/10 fit</span>
                                  </div>
                                  <p className="text-[10.5px] text-neutral-500 leading-snug">{cat.rationale}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <span className="text-xs text-neutral-500 font-medium">
                Sample scoring is free and does not charge your account balance.
              </span>
              <button
                type="button"
                disabled={isSimulatingSampleRun}
                onClick={handleConfirmSampleModal}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                Confirm and proceed
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
