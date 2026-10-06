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
  DollarSign,
  Activity,
  Lock,
  Building2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  CheckCircle2,
  X
} from 'lucide-react';
import { QualCampaign, QualFile } from './LeadQualification';

interface LeadQualCampaignBuilderProps {
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

  const [consentConfirmed, setConsentConfirmed] = useState<boolean>(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
    setConsentConfirmed(false);
  }, [selectedCampaign, clientProfile]);

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
    if (!consentConfirmed) return false;
    return true;
  }, [campaignName, targetCQC, businessLine, pendingFile, consentConfirmed]);

  // Execute Run Simulation
  const handleRunClick = () => {
    setTouched({
      campaignName: true,
      targetCQC: true,
      businessLine: true,
      file: true,
      consent: true
    });

    if (!isFormValid || !pendingFile) return;

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans select-none" id="lead-qual-builder-container">
      
      {/* Processing Loading Screen */}
      {isProcessing ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 sm:p-12 shadow-sm text-center space-y-6 max-w-2xl mx-auto my-8">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-blue-50 rounded-full border border-blue-100">
            <Activity className="text-blue-600 animate-pulse" size={28} />
            <span className="absolute text-[10px] font-black text-blue-800">{progress}%</span>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-neutral-900">Qualifying Leads & Evaluating Intent Graph...</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
              Enriching accepted records against demographic markers, net-worth tiers, and propensity score models.
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
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200/80 pb-4">
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={onCancel}
                className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                title="Back to Campaign Management"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
                    {isExistingCampaign ? `Add File: ${selectedCampaign?.name}` : "Create Qualification Campaign"}
                  </h2>
                  {isExistingCampaign && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                      <Lock size={10} /> Locked Campaign
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {isExistingCampaign 
                    ? "Upload another audience file under this campaign's fixed Target CQC and Business line." 
                    : "Target-first lead qualification setup powered by your verified client profile."}
                </p>
              </div>
            </div>

            {isExistingCampaign && selectedCampaign && (
              <button
                type="button"
                onClick={() => onClone(selectedCampaign)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs self-start sm:self-auto active:scale-98"
              >
                <Copy size={13} className="text-neutral-500" />
                <span>Clone Campaign</span>
              </button>
            )}
          </div>

          {/* 1. Client Profile Strip (Read-only) */}
          <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white rounded-xl p-4 shadow-sm border border-neutral-700/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                <Building2 size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-wide text-neutral-200 truncate">{clientProfile.name}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-400 bg-white/10 px-2 py-0.5 rounded">
                    <Lock size={10} className="text-neutral-400" /> Read-only
                  </span>
                </div>
                <div className="text-xs text-neutral-300 font-medium flex items-center gap-2 mt-0.5 flex-wrap">
                  <span><strong className="text-white font-bold">{clientProfile.industry}</strong></span>
                  <span className="text-neutral-500">•</span>
                  <span>Ticket size: <strong className="text-white font-bold">{formatTicketSize(clientProfile.ticketSize)}</strong></span>
                  <span className="text-neutral-500">•</span>
                  <span>Purchase channel: <strong className="text-white font-bold">{clientProfile.purchaseChannel}</strong></span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 md:pt-0 border-t md:border-t-0 border-neutral-700/60 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-400 bg-blue-500/10 border border-blue-400/25 px-2.5 py-1 rounded-md">
                <span>Managed in Client Onboarding</span>
              </span>
            </div>
          </div>

          {/* Main Campaign Form Card */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-7 shadow-sm space-y-7">
            
            {/* 2. Campaign Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="inline-flex items-center text-xs font-bold text-neutral-800 uppercase tracking-wide">
                  <span>Campaign name</span> <span className="text-red-500 ml-1">*</span>
                  <InfoTooltip content="Descriptive identifier for this qualification campaign in tracking tables and reports." />
                </label>
                {isExistingCampaign && (
                  <span className="text-[10px] font-semibold text-neutral-400 flex items-center gap-1">
                    <Lock size={10} /> Fixed in existing campaign
                  </span>
                )}
              </div>
              
              <input 
                type="text" 
                value={campaignName}
                disabled={isExistingCampaign}
                onChange={(e) => {
                  setCampaignName(e.target.value);
                  setTouched(prev => ({ ...prev, campaignName: true }));
                }}
                placeholder="e.g. Zenith Festive Tier-1 Qualification"
                className={`w-full px-4 py-2.5 text-xs ${
                  isExistingCampaign 
                    ? 'bg-neutral-100/80 text-neutral-600 cursor-not-allowed border-neutral-200 font-bold' 
                    : 'bg-neutral-50/70 focus:bg-white text-neutral-900 border-neutral-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                } border rounded-xl font-semibold focus:outline-none transition-all`}
              />
              {touched.campaignName && !campaignName.trim() && (
                <p className="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                  <AlertTriangle size={12} /> Campaign name is required.
                </p>
              )}
            </div>

            {/* 3. Target CQC (Large currency input placed first) */}
            <div className="bg-blue-50/40 border border-blue-200/60 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center text-xs font-bold text-neutral-800 uppercase tracking-wide">
                  <span>Target CQC</span> <span className="text-red-500 ml-1">*</span>
                  <InfoTooltip content="Cost per Qualified Customer target benchmark. Matches the Target CQC column on Dashboard v2." />
                </label>
                {isExistingCampaign && (
                  <span className="text-[10px] font-semibold text-neutral-500 flex items-center gap-1">
                    <Lock size={10} /> Fixed in existing campaign
                  </span>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-extrabold text-lg">₹</span>
                <input 
                  type="number" 
                  disabled={isExistingCampaign}
                  value={targetCQC || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    setTargetCQC(val);
                    setTouched(prev => ({ ...prev, targetCQC: true }));
                  }}
                  placeholder="18"
                  className={`w-full pl-9 pr-4 py-3 text-lg font-bold ${
                    isExistingCampaign 
                      ? 'bg-neutral-100/80 text-neutral-700 cursor-not-allowed border-neutral-200' 
                      : 'bg-white text-neutral-900 border-blue-300/80 focus:border-blue-600 focus:ring-3 focus:ring-blue-500/20'
                  } border rounded-xl focus:outline-none transition-all`}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] pt-1">
                <p className="text-neutral-500 font-medium">
                  What you're willing to pay to qualify one prospect.
                </p>
                <p className="text-neutral-600 font-semibold flex items-center gap-1">
                  <span>Your last 30 days avg:</span>
                  <span className="inline-flex items-center text-neutral-900 font-bold bg-white px-2 py-0.5 rounded border border-neutral-200 shadow-2xs">
                    ₹18
                  </span>
                </p>
              </div>

              {touched.targetCQC && (!targetCQC || targetCQC <= 0) && (
                <p className="text-[11px] text-red-500 font-bold flex items-center gap-1">
                  <AlertTriangle size={12} /> Target CQC must be greater than ₹0.
                </p>
              )}
            </div>

            {/* 4. Business Line (Single-select scoped to client profile) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="inline-flex items-center text-xs font-bold text-neutral-800 uppercase tracking-wide">
                  <span>Business line</span> <span className="text-red-500 ml-1">*</span>
                  <InfoTooltip content="Scoped to your onboarded business lines. Sets the evaluation and propensity model for this campaign." />
                </label>
                {isExistingCampaign && (
                  <span className="text-[10px] font-semibold text-neutral-400 flex items-center gap-1">
                    <Lock size={10} /> Fixed in existing campaign
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {clientProfile.businessLines.map((line) => {
                  const isSelected = businessLine === line;
                  return (
                    <button
                      key={line}
                      type="button"
                      disabled={isExistingCampaign}
                      onClick={() => {
                        if (!isExistingCampaign) {
                          setBusinessLine(line);
                          setTouched(prev => ({ ...prev, businessLine: true }));
                        }
                      }}
                      className={`px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all text-center flex items-center justify-center gap-1.5 ${
                        isExistingCampaign
                          ? isSelected
                            ? 'bg-neutral-800 text-white border-neutral-800 opacity-90 cursor-not-allowed'
                            : 'bg-neutral-50 text-neutral-400 border-neutral-200 opacity-60 cursor-not-allowed'
                          : isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs cursor-pointer'
                            : 'bg-neutral-50/70 text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer'
                      }`}
                    >
                      {isSelected && <Check size={13} className="shrink-0 stroke-[3]" />}
                      <span>{line}</span>
                    </button>
                  );
                })}
              </div>

              {touched.businessLine && !businessLine && (
                <p className="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                  <AlertTriangle size={12} /> Please select a business line.
                </p>
              )}
            </div>

            {/* 5. File Upload (.csv / .xls / .xlsx) */}
            <div className="space-y-3">
              <label className="inline-flex items-center text-xs font-bold text-neutral-800 uppercase tracking-wide">
                <span>Upload Audience File</span> <span className="text-red-500 ml-1">*</span>
                <InfoTooltip content="Accepts .csv, .xls, and .xlsx prospect files up to 25 MB. Incomplete contact rows missing both phone and email are skipped individually." />
              </label>

              {/* Hidden file input */}
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
                  className="border-2 border-dashed border-neutral-300 hover:border-blue-500 bg-neutral-50/60 hover:bg-blue-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all"
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-2xs text-neutral-500 border border-neutral-200">
                    <UploadCloud size={24} className="text-blue-600" />
                  </div>
                  <h4 className="text-xs font-bold text-neutral-900">Click or drag & drop audience file to validate</h4>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Accepts <strong>.csv</strong>, <strong>.xls</strong>, or <strong>.xlsx</strong> files (Up to 25 MB)
                  </p>
                  <span className="inline-block mt-3 text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-md border border-neutral-200">
                    Rows missing both email & phone are skipped individually without rejecting the whole file
                  </span>
                </div>
              ) : (
                <div className="border border-neutral-200 rounded-2xl p-5 bg-neutral-50/40 space-y-4">
                  {/* File preview header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                        <FileSpreadsheet size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900">{pendingFile.name}</h4>
                        <p className="text-[10.5px] text-neutral-500 font-mono mt-0.5">{pendingFile.size}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingFile(null)}
                      className="p-1.5 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 rounded-lg transition-colors cursor-pointer"
                      title="Replace file"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* 6. Validation Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                          Accepted Rows
                        </span>
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      </div>
                      <div className="text-xl font-black text-emerald-950 mt-1">
                        {pendingFile.rowsAccepted.toLocaleString('en-IN')}
                      </div>
                      <p className="text-[10.5px] text-emerald-700 font-medium mt-0.5">
                        Ready for qualification & scoring
                      </p>
                    </div>

                    <div className="bg-neutral-100/90 border border-neutral-200 rounded-xl p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">
                          Skipped Rows
                        </span>
                        <span className="text-[10px] font-bold text-neutral-500 bg-white px-2 py-0.5 rounded border border-neutral-200">
                          {pendingFile.rowsSkipped} rows
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {pendingFile.skipReasons.map((reason, idx) => (
                          <div key={idx} className="text-[10px] text-neutral-600 flex items-start justify-between gap-2">
                            <span className="truncate">• {reason.reason}</span>
                            <span className="font-mono font-bold text-neutral-700 shrink-0">({reason.count})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 7. Stat Tiles: Cost estimate, Running total spend, Est. CQC vs Target */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    
                    {/* Cost Estimate (this file) */}
                    <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                        Cost estimate (this file)
                      </span>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-xl font-black text-neutral-900 tracking-tight">
                          ₹{pendingFile.cost.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                          {pendingFile.rowsAccepted} rows
                        </span>
                      </div>
                    </div>

                    {/* Running total spend (this campaign) */}
                    <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                        Running total spend
                      </span>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-xl font-black text-neutral-900 tracking-tight">
                          ₹{runningTotalSpend.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                          {isExistingCampaign ? 'Cumulative' : 'Initial file'}
                        </span>
                      </div>
                    </div>

                    {/* Est. CQC vs Target */}
                    <div className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
                      isWithinTarget
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                        : 'bg-amber-50/80 border-amber-300 text-amber-950'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isWithinTarget ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          Est. CQC vs Target
                        </span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          isWithinTarget 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-amber-600 text-white'
                        }`}>
                          {isWithinTarget ? (
                            <Check size={12} className="stroke-[3]" />
                          ) : (
                            <AlertTriangle size={12} className="stroke-[3]" />
                          )}
                        </div>
                      </div>

                      <div className="mt-2">
                        <div className="flex items-baseline gap-2">
                          <span className={`text-xl font-black tracking-tight ${
                            isWithinTarget ? 'text-emerald-900' : 'text-amber-900'
                          }`}>
                            ₹{estCQC}
                          </span>
                          <span className="text-[11px] text-neutral-500 font-medium">
                            (Target: ₹{targetCQC})
                          </span>
                        </div>
                        <p className={`text-[10.5px] font-semibold mt-1 leading-snug ${
                          isWithinTarget ? 'text-emerald-700' : 'text-amber-800'
                        }`}>
                          Qualifying this file will cost ~₹{estCQC} per prospect.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* 8. Advanced Settings (Collapsible, closed by default) */}
            <div className="border border-neutral-200/80 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-5 py-3.5 bg-neutral-50 hover:bg-neutral-100/70 transition-colors flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal size={14} className="text-neutral-500" />
                  <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                    Advanced settings
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-500 bg-white border border-neutral-200 px-2 py-0.5 rounded-full">
                    Optional notes
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-neutral-500 font-medium">
                  <span>{showAdvanced ? 'Hide controls' : 'Show controls'}</span>
                  {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {showAdvanced && (
                <div className="p-5 sm:p-6 bg-white space-y-4 border-t border-neutral-200/80">
                  <div>
                    <label className="inline-flex items-center text-xs font-bold text-neutral-800 uppercase tracking-wide mb-1.5">
                      <span>Internal notes / objective</span>
                      <InfoTooltip content="Record campaign goals, audience sourcing notes, or team comments." />
                    </label>
                    <textarea 
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Record internal notes, qualification objectives, or source attribution..."
                      className="w-full px-3.5 py-2 text-xs bg-neutral-50/70 focus:bg-white border border-neutral-200 rounded-xl text-neutral-900 font-medium placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 9. Consent Checkbox */}
            <div className="p-4 bg-neutral-50/80 border border-neutral-200/80 rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentConfirmed}
                  onChange={(e) => {
                    setConsentConfirmed(e.target.checked);
                    setTouched(prev => ({ ...prev, consent: true }));
                  }}
                  className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 mt-0.5 cursor-pointer"
                  id="consent_checkbox"
                />
                <span className="text-xs text-neutral-700 font-semibold leading-relaxed">
                  I confirm this list was collected with appropriate consent for this use.
                </span>
              </label>
              {touched.consent && !consentConfirmed && (
                <p className="text-[11px] text-red-500 font-bold mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> Sourcing consent confirmation is required before running qualification.
                </p>
              )}
            </div>

            {/* 10. Actions Footer: Cancel, Clone campaign (if existing), and Run */}
            <div className="pt-4 border-t border-neutral-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 bg-transparent hover:bg-neutral-100 rounded-xl transition-all cursor-pointer text-center"
              >
                Cancel
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                {isExistingCampaign && selectedCampaign && (
                  <button
                    type="button"
                    onClick={() => onClone(selectedCampaign)}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl shadow-2xs transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Copy size={13} className="text-neutral-500" />
                    <span>Clone campaign</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={!isFormValid}
                  onClick={handleRunClick}
                  className={`w-full sm:w-auto px-8 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm transition-all focus:outline-none flex items-center justify-center gap-2 ${
                    !isFormValid
                      ? 'bg-neutral-300 cursor-not-allowed text-neutral-500'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-98 cursor-pointer shadow-blue-500/20 shadow-md'
                  }`}
                  id="run_qualification_campaign_btn"
                >
                  <Activity size={14} />
                  <span>Run</span>
                </button>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};
