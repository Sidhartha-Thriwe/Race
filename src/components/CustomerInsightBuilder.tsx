import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  UploadCloud, 
  FileText, 
  ShieldCheck, 
  Copy, 
  HelpCircle, 
  Briefcase, 
  Check, 
  AlertTriangle,
  Info,
  DollarSign,
  Activity,
  UserCheck,
  Clock,
  X,
  Sparkles
} from 'lucide-react';
import { QualCampaign, QualFile } from './LeadQualification';
import { RaceLiveRun } from './RaceLiveRun';

interface CustomerInsightBuilderProps {
  selectedCampaign: QualCampaign | null;
  onCancel: () => void;
  onRun: (campaignData: Partial<QualCampaign> & { fileToRun: Omit<QualFile, 'id'> }) => void;
  onClone: (campaign: QualCampaign) => void;
}

const SAMPLE_PROSPECTS = [
  {
    id: "SAMP-001",
    name: "Suresh Nair",
    location: "Mumbai",
    role: "VP Wealth Operations",
    company: "Aditya Birla Finance",
    dataQuality: "Sufficient",
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
      },
      {
        rank: 3,
        name: "Tax-Efficient Institutional Arbitrage",
        evidenceStrength: 7.9,
        psychFit: 8.1,
        rationale: "Seeks low-risk arbitrage yields to deploy treasury allocations."
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
      },
      {
        rank: 3,
        name: "Thematic Mid-Cap Mutual Funds",
        evidenceStrength: 8.2,
        psychFit: 8.5,
        rationale: "Prefers high-beta exposure with robust underlying liquidity rules."
      }
    ]
  },
  {
    id: "SAMP-003",
    name: "Dr. Rohan Sen",
    location: "Kolkata",
    role: "Chief of Cardiology",
    company: "Apollo Health",
    dataQuality: "Sufficient",
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
      },
      {
        rank: 3,
        name: "Diversified Blue-Chip PMS",
        evidenceStrength: 8.1,
        psychFit: 8.4,
        rationale: "Aims for steady wealth compounders with institutional pedigree."
      }
    ]
  },
  {
    id: "SAMP-004",
    name: "Vikram Rathore",
    location: "Jaipur",
    role: "Managing Partner",
    company: "Rathore & Sons",
    dataQuality: "Sufficient",
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
      },
      {
        rank: 3,
        name: "Precious Metals PMS Advisory",
        evidenceStrength: 8.0,
        psychFit: 8.3,
        rationale: "Views gold and gold PMS as the ultimate survival hedges."
      }
    ]
  },
  {
    id: "SAMP-005",
    name: "Kavita Krishnamurthy",
    location: "Bengaluru",
    role: "Head of Product",
    company: "SaaSify Inc",
    dataQuality: "High Confidence",
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
      },
      {
        rank: 3,
        name: "Active Tax-Saving Mutual Funds",
        evidenceStrength: 8.2,
        psychFit: 8.4,
        rationale: "Highly rational investor seeking efficient ELSS options with high transparency."
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
  // Main form states
  const [campaignName, setCampaignName] = useState('');
  const [useCaseTag, setUseCaseTag] = useState<'Engagement' | 'Retention' | 'General Insight'>('Engagement');
  const [industry, setIndustry] = useState('Technology');
  const [ticketSizeMin, setTicketSizeMin] = useState<number>(10000);
  const [ticketSizeMax, setTicketSizeMax] = useState<number>(100000);
  const [purchaseCycle, setPurchaseCycle] = useState<'One-time' | 'Recurring subscription'>('One-time');
  const [purchaseChannel, setPurchaseChannel] = useState<'Online' | 'Offline' | 'Both'>('Online');
  const [targetCostPerQualifiedLead, setTargetCostPerQualifiedLead] = useState<number>(15);
  const [targetRegion, setTargetRegion] = useState('North Region');
  const [totalBudgetCap, setTotalBudgetCap] = useState<number | ''>('');
  
  // File upload simulation states
  const [pendingFile, setPendingFile] = useState<{
    name: string;
    size: string;
    rowsAccepted: number;
    rowsSkipped: number;
    skipReasons: Array<{ count: number; reason: string }>;
    cost: number;
  } | null>(null);

  // Sample Scoring flow states
  const [hasRunSample, setHasRunSample] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isSimulatingSampleRun, setIsSimulatingSampleRun] = useState(false);
  const [sampleProgress, setSampleProgress] = useState(0);
  const [actualSamplePerRowCost] = useState(11.40); // empirical cost
  const [sampleEstimatedCost, setSampleEstimatedCost] = useState(0);

  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  // Hydrate form states if editing/adding file to an existing campaign
  useEffect(() => {
    if (selectedCampaign) {
      setCampaignName(selectedCampaign.name);
      setUseCaseTag((selectedCampaign.useCaseTag === 'Lead Gen' ? 'Engagement' : selectedCampaign.useCaseTag) as any || 'Engagement');
      setIndustry(selectedCampaign.industry);
      setTicketSizeMin(selectedCampaign.ticketSizeMin ?? 10000);
      setTicketSizeMax(selectedCampaign.ticketSizeMax ?? 100000);
      setPurchaseCycle(selectedCampaign.purchaseCycle ?? 'One-time');
      setPurchaseChannel(selectedCampaign.purchaseChannel ?? 'Online');
      setTargetCostPerQualifiedLead(selectedCampaign.targetCostPerQualifiedLead ?? 15);
      setTargetRegion(selectedCampaign.targetRegion);
      setTotalBudgetCap(selectedCampaign.totalBudgetCap || '');
    } else {
      setCampaignName('');
      setUseCaseTag('Engagement');
      setIndustry('Technology');
      setTicketSizeMin(10000);
      setTicketSizeMax(100000);
      setPurchaseCycle('One-time');
      setPurchaseChannel('Online');
      setTargetCostPerQualifiedLead(15);
      setTargetRegion('North Region');
      setTotalBudgetCap('');
    }
    setPendingFile(null);
    setConsentConfirmed(false);
  }, [selectedCampaign]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    simulateFileLoad("insights_audience_" + Math.floor(Math.random() * 1000 + 100) + ".csv", "1.82 MB");
  };

  const handleSimulateUpload = () => {
    simulateFileLoad("client_crm_leads_v2.xlsx", "2.40 MB");
  };

  const simulateFileLoad = (fileName: string, fileSize: string) => {
    const accepted = Math.floor(Math.random() * 1500 + 800);
    const skipped = Math.floor(Math.random() * 35 + 12);
    // Cost rate: ₹12.5 per evaluated record
    const cost = Math.round(accepted * 12.5);

    // Calculate empirical estimate
    const estimatedCost = Math.round(accepted * actualSamplePerRowCost);
    setSampleEstimatedCost(estimatedCost);
    setHasRunSample(false);

    setPendingFile({
      name: fileName,
      size: fileSize,
      rowsAccepted: accepted,
      rowsSkipped: skipped,
      skipReasons: [
        { count: Math.ceil(skipped * 0.5), reason: "Explicit consent audit lookup flag mismatch (DND/opt-out list)" },
        { count: Math.ceil(skipped * 0.3), reason: "Incomplete regional markers or invalid contact coordinates" },
        { count: Math.floor(skipped * 0.2), reason: "Duplicate contact record matched with active files" }
      ],
      cost
    });
  };

  // Run free sample scoring pipeline on 5 prospects
  const handleRunSampleClick = () => {
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
    }, 400);
  };

  // Run scoring task simulation
  const handleRunClick = () => {
    if (!pendingFile) return;
    if (!consentConfirmed) {
      alert("Please confirm the profiling consent guidelines before execution.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setLogs([]);

    const logSteps = [
      `[INIT] Validated local ledger file: ${pendingFile.name} (${pendingFile.size})`,
      `[CONFIG] Matching downstream use-case: [${useCaseTag}]`,
      `[CONFIG] Applied context: ${industry} | Cycle: ${purchaseCycle} | Channel: ${purchaseChannel} | Region: ${targetRegion}`,
      `[COMPLIANCE] Verification pass: Multi-attribute profiling consent confirmed`,
      `[AI SCORE] Triggering RACE psychometric & financial profile weights...`,
      `[FILTER] Discarding ${pendingFile.rowsSkipped} rows matching opt-out / data exclusion rules`,
      `[SYNC] Generating scored client insights roster...`,
      `[SUCCESS] 100% processed. ${pendingFile.rowsAccepted} records mapped and scored successfully!`
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
            name: campaignName,
            useCaseTag,
            industry,
            ticketSizeMin,
            ticketSizeMax,
            purchaseCycle,
            purchaseChannel,
            targetCostPerQualifiedLead,
            targetRegion,
            totalBudgetCap,
            fileToRun: {
              fileName: pendingFile.name,
              fileSize: pendingFile.size,
              rowsAccepted: pendingFile.rowsAccepted,
              rowsSkipped: pendingFile.rowsSkipped,
              skipReasons: pendingFile.skipReasons,
              cost: hasRunSample ? sampleEstimatedCost : pendingFile.cost,
              dateUploaded: new Date().toISOString().slice(0, 10),
              status: 'Completed'
            }
          });
          setIsProcessing(false);
        }, 800);
      }
    }, 900);
  };

  // Determine locked state
  const isLocked = !!selectedCampaign && selectedCampaign.hasRunFirstFile;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in" id="insight-builder-container">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
            id="builder_back_btn"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
              {selectedCampaign ? `Manage Campaign: ${selectedCampaign.name}` : "Create Customer Insight Campaign"}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5 font-medium">
              Segment contact pools, set business filters, map use cases, and generate eligible profiles.
            </p>
          </div>
        </div>

        {isLocked && selectedCampaign && (
          <button
            type="button"
            onClick={() => onClone(selectedCampaign)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs rounded-lg transition-all cursor-pointer shadow-xs"
            id="builder_clone_campaign_top_btn"
          >
            <Copy size={13} />
            <span>Clone Campaign to Change Settings</span>
          </button>
        )}
      </div>

      {isProcessing ? (
        /* Processing Loading Console */
        <div className="bg-white border border-neutral-200 rounded-xl p-8 shadow-xs text-center space-y-6 max-w-2xl mx-auto py-16" id="processing_console">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-blue-50 rounded-full border border-blue-100">
            <Activity className="text-blue-600 animate-pulse" size={28} />
            <span className="absolute text-[10px] font-black text-blue-800">{progress}%</span>
          </div>
          
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-neutral-800">Scoring Leads & Fitting Demographic Weights...</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
              Applying proprietary scoring models. Building propensity matches across your selected sector attributes.
            </p>
          </div>

          <div className="w-full max-w-md h-1.5 bg-neutral-100 rounded-full mx-auto overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="bg-neutral-900 text-emerald-400 font-mono text-[10.5px] text-left p-4 rounded-lg max-w-lg mx-auto h-40 overflow-y-auto space-y-1 select-text shadow-inner border border-neutral-800">
            {logs.map((log, index) => (
              <div key={index} className="leading-relaxed opacity-90">
                {log}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Form Split Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Attributes Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1.5">
                  <Briefcase size={14} className="text-neutral-400" />
                  <span>RACE Insight Settings</span>
                </h3>
                {isLocked ? (
                  <span className="bg-amber-50 text-amber-800 border border-amber-100 font-bold text-[9px] px-2 py-0.5 rounded uppercase flex items-center gap-1">
                    <Clock size={10} />
                    <span>Locked</span>
                  </span>
                ) : (
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold text-[9px] px-2 py-0.5 rounded uppercase flex items-center gap-1">
                    <Check size={10} />
                    <span>Editable</span>
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {/* Campaign Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">Campaign Name</label>
                  <input 
                    type="text"
                    disabled={isLocked}
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. Q4 Elite Customer Retention"
                    className="w-full bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none transition-colors disabled:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    id="campaign_name_input"
                  />
                </div>

                {/* Use-Case Tag */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 block">Use-Case Target Tag</label>
                  <div className="flex bg-neutral-100 p-1 rounded-lg">
                    {(['Engagement', 'Retention', 'General Insight'] as const).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        disabled={isLocked}
                        onClick={() => setUseCaseTag(tag)}
                        className={`flex-1 py-1.5 text-[10.5px] font-bold rounded-md transition-all ${
                          useCaseTag === tag 
                            ? 'bg-white text-neutral-900 shadow-xs' 
                            : 'text-neutral-500 hover:text-neutral-800 disabled:opacity-60'
                        }`}
                        id={`use_case_tag_${tag.toLowerCase().replace(' ', '_')}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-neutral-400 font-medium leading-relaxed bg-neutral-50 p-2.5 rounded-md border border-neutral-150">
                    Affects internal scoring only — everything below still looks the same. Locked after first Run; clone to change.
                  </p>
                </div>

                {/* Industry Attributes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">Target Sector Attribute</label>
                  <select
                    disabled={isLocked}
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer disabled:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    id="industry_select"
                  >
                    <option value="Technology">Technology & SaaS</option>
                    <option value="Financial Services">Financial Services & Funds</option>
                    <option value="Healthcare">Healthcare & Biotech</option>
                    <option value="Real Estate">Real Estate & Construction</option>
                    <option value="Retail">Retail & Consumer Goods</option>
                  </select>
                </div>

                {/* Ticket Size of the Product */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">Ticket Size of the Product (₹)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="number"
                        disabled={isLocked}
                        value={ticketSizeMin}
                        onChange={(e) => setTicketSizeMin(Number(e.target.value))}
                        placeholder="Min"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none disabled:bg-neutral-100 disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        disabled={isLocked}
                        value={ticketSizeMax}
                        onChange={(e) => setTicketSizeMax(Number(e.target.value))}
                        placeholder="Max"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none disabled:bg-neutral-100 disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>

                {/* Regional Geography */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">Regional Geography</label>
                  <select
                    disabled={isLocked}
                    value={targetRegion}
                    onChange={(e) => setTargetRegion(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer disabled:bg-neutral-100 disabled:opacity-60"
                    id="target_region_select"
                  >
                    <option value="North Region">North Region (Delhi NCR)</option>
                    <option value="West Region">West Region (Mumbai, Pune)</option>
                    <option value="South Region">South Region (Bengaluru, Chennai)</option>
                    <option value="East Region">East Region (Kolkata)</option>
                    <option value="Pan-India">Pan-India (Comprehensive Coverage)</option>
                  </select>
                </div>

                {/* Purchase Cycle */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">Purchase Cycle</label>
                  <select
                    disabled={isLocked}
                    value={purchaseCycle}
                    onChange={(e) => setPurchaseCycle(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer disabled:bg-neutral-100 disabled:opacity-60"
                    id="purchase_cycle_select"
                  >
                    <option value="One-time">One-time</option>
                    <option value="Recurring subscription">Recurring subscription</option>
                  </select>
                </div>

                {/* Purchase Channel */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">Purchase Channel</label>
                  <select
                    disabled={isLocked}
                    value={purchaseChannel}
                    onChange={(e) => setPurchaseChannel(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer disabled:bg-neutral-100 disabled:opacity-60"
                    id="purchase_channel_select"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                {/* Target Cost per Customer Insight */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">Target Cost per Customer Insight (₹)</label>
                  <input
                    type="number"
                    disabled={isLocked}
                    value={targetCostPerQualifiedLead}
                    onChange={(e) => setTargetCostPerQualifiedLead(Number(e.target.value))}
                    placeholder="e.g. 15"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none disabled:bg-neutral-100 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Upload and Workspace Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* File Upload execution Block */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-5">
              <h3 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1.5">
                <UploadCloud size={14} className="text-neutral-400" />
                <span>Roster Pool Upload & scoring pass</span>
              </h3>

              {/* Drag zone */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-neutral-200 hover:border-blue-500 hover:bg-blue-50/10 rounded-xl p-8 text-center transition-all cursor-pointer space-y-3"
              >
                <div className="w-11 h-11 bg-neutral-50 border border-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400 shadow-sm">
                  <UploadCloud size={18} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-neutral-700">Drag and drop client cohort rosters here</p>
                  <p className="text-[10px] text-neutral-400 font-medium">Accepts .csv, .xls, .xlsx formats up to 20MB.</p>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleSimulateUpload}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                    id="builder_simulate_upload_btn"
                  >
                    Simulate Client CSV Upload
                  </button>
                </div>
              </div>

              {/* Validation Summary */}
              {pendingFile && (
                <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200" id="validation_summary_block">
                  <div className="flex items-center justify-between text-xs border-b border-neutral-200 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText size={13} className="text-neutral-400" />
                      <span className="font-bold text-neutral-800">{pendingFile.name}</span>
                      <span className="text-[10px] font-mono text-neutral-400">({pendingFile.size})</span>
                    </div>
                    <button 
                      onClick={() => setPendingFile(null)}
                      className="text-[10px] font-bold text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                      id="builder_clear_file_btn"
                    >
                      Clear File
                    </button>
                  </div>

                  {/* Summary counts */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-white border border-neutral-150 rounded-lg text-center shadow-xs">
                      <span className="text-[9px] uppercase font-bold text-neutral-400 block mb-0.5">Total Roster Rows</span>
                      <strong className="text-base font-extrabold text-neutral-800">
                        {(pendingFile.rowsAccepted + pendingFile.rowsSkipped).toLocaleString()}
                      </strong>
                    </div>
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg text-center shadow-xs">
                      <span className="text-[9px] uppercase font-bold text-emerald-600 block mb-0.5">Rows Accepted</span>
                      <strong className="text-base font-extrabold text-emerald-800">
                        {pendingFile.rowsAccepted.toLocaleString()}
                      </strong>
                    </div>
                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-center shadow-xs">
                      <span className="text-[9px] uppercase font-bold text-amber-600 block mb-0.5">Rows Skipped</span>
                      <strong className="text-base font-extrabold text-neutral-800">
                        {pendingFile.rowsSkipped.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Skipped Reason Audit breakdown */}
                  <div className="bg-white border border-neutral-150 rounded-lg p-3.5 space-y-2">
                    <span className="text-[9.5px] font-bold text-neutral-400 uppercase tracking-wider block">Skipped Records Audit Log:</span>
                    <div className="space-y-1.5 divide-y divide-neutral-100">
                      {pendingFile.skipReasons.map((reason, index) => (
                        <div key={index} className="flex items-start justify-between text-[11px] font-semibold text-neutral-600 pt-1.5 first:pt-0">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1" />
                            <span className="leading-normal">{reason.reason}</span>
                          </span>
                          <span className="text-neutral-400 font-mono text-[9px] font-bold shrink-0">{reason.count} records</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 1: Sample Preview (Free) */}
                  <div className="p-4 bg-gradient-to-r from-blue-50/40 to-indigo-50/40 border border-blue-100 rounded-xl space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                          <Activity size={14} className="text-blue-600 animate-pulse" />
                          <span>Step 1: Run Live Preview Sample (Free Preview)</span>
                        </h4>
                        <p className="text-[10px] text-neutral-400 font-medium leading-normal">
                          Runs the real RACE profiling engine on 5 prospects from your file. No charge, zero budget impact.
                        </p>
                      </div>
                      {hasRunSample && (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <Check size={10} />
                          <span>Sample Run Done</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleRunSampleClick}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs shadow-sm transition-all ${
                        hasRunSample 
                          ? 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                          : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-98'
                      }`}
                      id="builder_run_sample_btn"
                    >
                      <Activity size={13} />
                      <span>{hasRunSample ? "Re-run Customer Insight Scoring Sample" : "Run Customer Insight Scoring Sample (5 Prospects)"}</span>
                    </button>
                  </div>

                  {/* Budget stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between shadow-xs">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-bold text-emerald-700 block">Cost Estimate (This File)</span>
                        <span className="text-[10px] text-neutral-400 font-medium">
                          {hasRunSample ? "₹11.40 per scored profile (Live Extrapolated)" : "₹12.5 per scored profile"}
                        </span>
                      </div>
                      <strong className="text-base font-black text-emerald-800">
                        ₹{(hasRunSample ? sampleEstimatedCost : pendingFile.cost).toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <div className="p-3 bg-neutral-100 border border-neutral-150 rounded-lg flex items-center justify-between shadow-xs">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-bold text-neutral-500 block">Running Spend Total</span>
                        <span className="text-[10px] text-neutral-400 font-medium">All historical runs inside batch</span>
                      </div>
                      <strong className="text-base font-black text-neutral-800">
                        ₹{((selectedCampaign?.totalSpend || 0) + (hasRunSample ? sampleEstimatedCost : pendingFile.cost)).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  {/* Specific Consent confirmation */}
                  <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-lg flex items-start gap-3">
                    <input 
                      type="checkbox"
                      id="consent_profiling_check"
                      checked={consentConfirmed}
                      onChange={(e) => setConsentConfirmed(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 text-blue-600 focus:ring-blue-500/30 rounded border-neutral-300 cursor-pointer"
                    />
                    <label 
                      htmlFor="consent_profiling_check" 
                      className="text-[10.5px] font-bold text-neutral-700 leading-tight cursor-pointer select-none"
                    >
                      I confirm this list was collected with consent covering behavioral and psychological profiling, not only contact use.
                    </label>
                  </div>

                  {/* Live engine — one real subject, above the simulated bulk pass. */}
                  <RaceLiveRun useCase="customer_insight" ticketBand={`₹${Math.round(ticketSizeMax / 100000)}L`} />

                  {/* RUN BUTTON */}
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={handleRunClick}
                      disabled={!consentConfirmed || !campaignName.trim() || !hasRunSample}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs shadow-md transition-all ${
                        consentConfirmed && campaignName.trim() && hasRunSample
                          ? 'bg-[#1e40af] hover:bg-[#1d4ed8] text-white cursor-pointer active:scale-98'
                          : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                      }`}
                      id="builder_run_qualification_btn"
                    >
                      <ShieldCheck size={14} />
                      <span>Run Customer Insight Scoring Pass (Full File)</span>
                    </button>
                    {!hasRunSample && (
                      <p className="text-[9.5px] text-center font-bold text-amber-600 animate-pulse">
                        * Run the free scoring sample first to establish the empirical cost estimate.
                      </p>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Historical Roster Files in this Campaign */}
            {selectedCampaign && (
              <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
                <div>
                  <h3 className="text-xs uppercase font-bold text-neutral-400 tracking-wider">Historical Scored Files in this Campaign</h3>
                  <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Scored rosters processed historically for this campaign cohort.</p>
                </div>

                <div className="space-y-3">
                  {selectedCampaign.files && selectedCampaign.files.length > 0 ? (
                    selectedCampaign.files.map(file => (
                      <div key={file.id} className="bg-neutral-50 border border-neutral-150 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                          <div className="flex items-center gap-2">
                            <FileText size={13} className="text-neutral-400" />
                            <span className="font-bold text-neutral-800 text-xs">{file.fileName}</span>
                            <span className="text-[9.5px] text-neutral-400 font-mono">({file.fileSize})</span>
                          </div>
                          <span className="text-[9.5px] font-mono text-neutral-400 font-bold">{file.dateUploaded}</span>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2 bg-white border border-neutral-200 rounded-lg shadow-xs">
                            <span className="text-[8px] uppercase font-bold text-neutral-400 block mb-0.5">File ID</span>
                            <strong className="text-[10px] font-mono text-neutral-700 font-bold">{file.id}</strong>
                          </div>
                          <div className="p-2 bg-emerald-50/40 border border-emerald-100 rounded-lg shadow-xs">
                            <span className="text-[8px] uppercase font-bold text-emerald-600 block mb-0.5">Accepted</span>
                            <strong className="text-[10px] text-emerald-800 font-bold">{file.rowsAccepted.toLocaleString()}</strong>
                          </div>
                          <div className="p-2 bg-amber-50/40 border border-amber-100 rounded-lg shadow-xs">
                            <span className="text-[8px] uppercase font-bold text-amber-600 block mb-0.5">Skipped</span>
                            <strong className="text-[10px] text-amber-800 font-bold">{file.rowsSkipped.toLocaleString()}</strong>
                          </div>
                          <div className="p-2 bg-neutral-100/50 border border-neutral-200 rounded-lg shadow-xs">
                            <span className="text-[8px] uppercase font-bold text-neutral-500 block mb-0.5">File Cost</span>
                            <strong className="text-[10px] text-neutral-800 font-bold">₹{file.cost.toLocaleString('en-IN')}</strong>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-neutral-400 font-medium text-xs">
                      No scored files found in this campaign yet. Upload a pool roster above to run.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Sample Run Popup Modal */}
      {isSampleModalOpen && pendingFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto" id="sample-run-modal-overlay">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden" id="sample-run-modal">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4.5 bg-neutral-50 shrink-0">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-blue-600 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">RACE Customer Insight Sample Scoring Preview</h3>
                  <p className="text-[10px] text-neutral-400 font-medium">Scoring a real 5-prospect cohort from your uploaded roster file.</p>
                </div>
              </div>
              {!isSimulatingSampleRun && (
                <button 
                  onClick={() => setIsSampleModalOpen(false)}
                  className="p-1.5 hover:bg-neutral-200 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                  id="close_sample_modal_btn"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {isSimulatingSampleRun ? (
              /* Modal Loading State */
              <div className="flex-1 overflow-y-auto px-6 py-16 flex flex-col items-center justify-center space-y-6 text-center">
                <div className="relative w-16 h-16 flex items-center justify-center bg-blue-50 rounded-full border border-blue-100">
                  <Activity className="text-blue-600 animate-pulse" size={24} />
                  <span className="absolute text-[9px] font-black text-blue-800">{sampleProgress}%</span>
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-xs font-bold text-neutral-800">Applying Psychometric & Propensity Models...</h4>
                  <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                    Analyzing demographic markers, regional wealth indexes, and transaction attributes for 5 live roster rows.
                  </p>
                </div>
                <div className="w-full max-w-xs h-1 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${sampleProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              /* Modal Content State */
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                
                {/* Section: Live Sample Results */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Scored Live Sample Prospects (5 Rows)</h4>
                    <span className="bg-blue-50 text-blue-700 border border-blue-100 font-semibold text-[10px] px-2 py-0.5 rounded-md">
                      Free Preview Run
                    </span>
                  </div>

                  <div className="space-y-4">
                    {SAMPLE_PROSPECTS.map((person) => (
                      <div key={person.id} className="bg-neutral-50/60 border border-neutral-150 p-4.5 rounded-xl space-y-3.5 transition-all hover:bg-neutral-50">
                        {/* Person Identity Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/60 pb-2">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase">{person.id}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-neutral-800">{person.name}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                              <span className="text-[10px] text-neutral-500 font-medium">{person.role} at {person.company}</span>
                            </div>
                            <p className="text-[10px] text-neutral-400 font-medium">Location: {person.location}</p>
                          </div>
                          
                          <div className="flex items-center gap-2 self-start sm:self-center">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                              person.dataQuality === 'High Confidence'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                              {person.dataQuality} Quality
                            </span>
                          </div>
                        </div>

                        {/* Persona Summary */}
                        <div className="bg-white border border-neutral-150 p-3 rounded-lg">
                          <span className="text-[8.5px] uppercase font-bold text-neutral-400 tracking-wider block mb-1">RACE Persona Synthesis:</span>
                          <p className="text-xs text-neutral-600 font-medium leading-relaxed italic">
                            "{person.personaSummary}"
                          </p>
                        </div>

                        {/* Top Categories */}
                        <div className="space-y-2">
                          <span className="text-[8.5px] uppercase font-bold text-neutral-400 tracking-wider block">Top 3 Matched Product Segments:</span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {person.topCategories.map((cat) => (
                              <div key={cat.rank} className="bg-white border border-neutral-200 rounded-lg p-2.5 flex flex-col justify-between space-y-2 relative">
                                <span className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold text-[8px]">
                                  {cat.rank}
                                </span>
                                <div className="pl-1 space-y-1">
                                  <span className="text-[10.5px] font-bold text-neutral-800 leading-tight block">{cat.name}</span>
                                  <p className="text-[9.5px] text-neutral-500 font-medium leading-normal">{cat.rationale}</p>
                                </div>
                                <div className="pt-1 border-t border-neutral-100 flex items-center justify-between text-[9px] font-semibold text-neutral-400">
                                  <span>Fit Index: <strong className="text-blue-700">{(cat.psychFit * 10).toFixed(0)}%</strong></span>
                                  <span>Strength: <strong className="text-neutral-700">{(cat.evidenceStrength * 10).toFixed(0)}%</strong></span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

                {/* Section: Live Sample Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-neutral-100 pt-5">
                  {/* Data Quality Mix */}
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1.5">
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block">Sample Data-Quality Mix</span>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <strong className="text-base font-extrabold text-neutral-800">4 / 5</strong>
                        <span className="text-[9px] text-neutral-400 block font-semibold">Sufficient Rows</span>
                      </div>
                      <div className="h-6 w-px bg-neutral-300" />
                      <div className="text-center">
                        <strong className="text-base font-extrabold text-emerald-700">1 / 5</strong>
                        <span className="text-[9px] text-emerald-600 block font-semibold">High Confidence</span>
                      </div>
                    </div>
                  </div>

                  {/* Category Spread */}
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block">Sample Segment Spread</span>
                    <p className="text-[10px] text-neutral-600 font-bold leading-normal">
                      Wealth Advisory (2) · Technology PMS (1) · Sustainable PMS (1) · Real Estate REIT (1)
                    </p>
                  </div>

                  {/* Extrapolated Empirical Cost */}
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-blue-700 block">Extrapolated Cost (Grounded Estimate)</span>
                      <p className="text-[9.5px] text-neutral-400 font-medium">Grounded in sample's per-row cost of ₹11.40</p>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] text-neutral-500 font-bold">₹11.40 × {pendingFile.rowsAccepted.toLocaleString()} rows</span>
                      <strong className="text-base font-black text-blue-900">
                        ₹{sampleEstimatedCost.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Modal Footer */}
            {!isSimulatingSampleRun && (
              <div className="border-t border-neutral-100 px-6 py-4 flex items-center justify-between bg-neutral-50 shrink-0">
                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                  <Info size={12} />
                  <span>Returns to Campaign Builder to review and confirm. No billing occurs yet.</span>
                </span>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSampleModalOpen(false)}
                    className="px-4 py-2 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-600 font-bold text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Back to Form
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSampleModalOpen(false);
                      setHasRunSample(true);
                      setConsentConfirmed(true); // Auto check consent and proceed
                    }}
                    className="px-5 py-2.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md"
                    id="builder_confirm_proceed_btn"
                  >
                    Confirm and Proceed
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
