import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  ChevronDown, 
  Target, 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  History, 
  PlusCircle, 
  ArrowRight, 
  Coins, 
  Share2,
  Download,
  Check,
  TrendingDown,
  Activity,
  ArrowUpRight,
  HelpCircle
} from 'lucide-react';
export type GlobalSectionType = 
  | 'dashboard' 
  | 'leadgen-dashboard' 
  | 'leadgen-dashboard-v2'
  | 'builder' 
  | 'management' 
  | 'leads' 
  | 'qual-dashboard' 
  | 'qual-builder' 
  | 'qual-management' 
  | 'qual-feed' 
  | 'insight-dashboard' 
  | 'insight-builder' 
  | 'insight-management' 
  | 'insight-feed'
  | 'users-access'
  | 'categories-management'
  | 'internal-insight';

interface GlobalOverviewProps {
  setActiveSection: (section: GlobalSectionType) => void;
}

// Default Lead Gen Seed (mirrors DEFAULT_CAMPAIGNS in AdminPanel.tsx)
const DEFAULT_LEADGEN_CAMPAIGNS = [
  {
    id: "CAMP-72810",
    name: "Festive Season Push",
    startDate: "2026-09-01",
    status: "Active",
    currentSpend: 1250000,
    leadsAcquired: 780,
    targetCAC: 1500,
    productSector: "Credit Cards"
  },
  {
    id: "CAMP-94182",
    name: "HNI Wealth Onboarding",
    startDate: "2026-09-10",
    status: "Active",
    currentSpend: 360000,
    leadsAcquired: 148,
    targetCAC: 3200,
    productSector: "Wealth Advisory"
  },
  {
    id: "CAMP-38102",
    name: "Premium Card Upsell",
    startDate: "2026-09-15",
    status: "Active",
    currentSpend: 28000,
    leadsAcquired: 12,
    targetCAC: 1100,
    productSector: "Credit Cards"
  },
  {
    id: "CAMP-10582",
    name: "UHNI Referral Drive",
    startDate: "2026-09-20",
    status: "Scheduled",
    currentSpend: 0,
    leadsAcquired: 0,
    targetCAC: 5500,
    productSector: "Custom Portfolio"
  },
  {
    id: "CAMP-49520",
    name: "Mass Affluent Starter",
    startDate: "2026-09-05",
    status: "Draft",
    currentSpend: 0,
    leadsAcquired: 0,
    targetCAC: 800,
    productSector: "Retail Banking"
  },
  {
    id: "CAMP-20194",
    name: "NRE Deposits Spark",
    startDate: "2026-08-01",
    status: "Completed",
    currentSpend: 420000,
    leadsAcquired: 310,
    targetCAC: 1400,
    productSector: "Deposits"
  }
];

// Default Qual / Insight Seed (mirrors INITIAL_QUAL_CAMPAIGNS in LeadQualification.tsx)
const DEFAULT_QUAL_CAMPAIGNS = [
  {
    id: "QUAL-101",
    name: "HNIs North Region v2",
    peopleScored: 4800,
    status: "Completed",
    dateCreated: "2026-09-02",
    totalSpend: 45000,
    costTarget: 12,
    useCaseTag: "Lead Qualification"
  },
  {
    id: "QUAL-102",
    name: "Ultra-HNIs Mutual Fund Propensity",
    peopleScored: 2400,
    status: "Completed",
    dateCreated: "2026-09-05",
    totalSpend: 32000,
    costTarget: 15,
    useCaseTag: "Lead Qualification"
  },
  {
    id: "QUAL-103",
    name: "Festive Credit Cards Pilot",
    peopleScored: 1500,
    status: "Completed",
    dateCreated: "2026-09-10",
    totalSpend: 15000,
    costTarget: 12,
    useCaseTag: "Lead Qualification"
  },
  {
    id: "QUAL-104",
    name: "HNI Wealth Builders South",
    peopleScored: 1200,
    status: "Processing",
    dateCreated: "2026-09-15",
    totalSpend: 12000,
    costTarget: 12,
    useCaseTag: "Lead Qualification"
  },
  {
    id: "QUAL-105",
    name: "Mass Affluent Credit Upsell Draft",
    peopleScored: 0,
    status: "Queued",
    dateCreated: "2026-09-16",
    totalSpend: 0,
    costTarget: 12,
    useCaseTag: "Lead Qualification"
  },
  {
    id: "QUAL-106",
    name: "Corporate Gold Mutual Funds",
    peopleScored: 2000,
    status: "Completed",
    dateCreated: "2026-09-11",
    totalSpend: 25000,
    costTarget: 14,
    useCaseTag: "Lead Qualification"
  },
  {
    id: "QUAL-107",
    name: "HNI Card Upgrade Bureau Filter",
    peopleScored: 150,
    status: "Completed",
    dateCreated: "2026-09-13",
    totalSpend: 5000,
    costTarget: 30, // Higher target due to bureau scrubbing
    useCaseTag: "Lead Qualification"
  },
  // Customer Insight Campaigns (flagged with psychometric useCases)
  {
    id: "INS-101",
    name: "Mass Affluent Sentiment Survey",
    peopleScored: 3400,
    status: "Completed",
    dateCreated: "2026-09-08",
    totalSpend: 38000,
    useCaseTag: "Engagement"
  },
  {
    id: "INS-102",
    name: "HNI Wealth Advisory Churn Model",
    peopleScored: 1800,
    status: "Completed",
    dateCreated: "2026-09-12",
    totalSpend: 29000,
    useCaseTag: "Retention"
  },
  {
    id: "INS-103",
    name: "SME Founders Behavior Pulse",
    peopleScored: 900,
    status: "Processing",
    dateCreated: "2026-09-14",
    totalSpend: 14000,
    useCaseTag: "General Insight"
  }
];

export const GlobalOverview: React.FC<GlobalOverviewProps> = ({ setActiveSection }) => {
  // Filters state
  const [dateRange, setDateRange] = useState<'since-last' | '7-days' | '30-days' | 'quarter' | 'ytd'>('since-last');
  const [moduleFilter, setModuleFilter] = useState<'All' | 'Lead Gen' | 'Lead Qualification' | 'Customer Insight'>('All');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Sync state from LocalStorage on mount/update (Fidelity Assurance)
  const [leadGenCampaigns] = useState<any[]>(() => {
    const cached = localStorage.getItem('zenith_campaigns');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { return DEFAULT_LEADGEN_CAMPAIGNS; }
    }
    return DEFAULT_LEADGEN_CAMPAIGNS;
  });

  const [qualCampaigns] = useState<any[]>(() => {
    const cached = localStorage.getItem('zenith_qual_campaigns');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { return DEFAULT_QUAL_CAMPAIGNS; }
    }
    return DEFAULT_QUAL_CAMPAIGNS;
  });

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleShare = () => {
    triggerToast("Dashboard URL copied to clipboard. Ready to share reporting view!");
  };

  const handleExport = () => {
    triggerToast("Generating consolidated Excel/PDF report... Download starting in 1s.");
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'since-last': return 'Since last opened';
      case '7-days': return 'Last 7 days';
      case '30-days': return 'Last 30 days';
      case 'quarter': return 'This quarter';
      case 'ytd': return 'Year to date';
    }
  };

  // Safe relative date checker (Now is fixed at 2026-09-17)
  const isCampaignInDateRange = (dateStr: string) => {
    if (dateRange === 'since-last') return true;
    
    const referenceDate = new Date("2026-09-17T00:00:00");
    const campaignDate = new Date(dateStr);
    const diffTime = referenceDate.getTime() - campaignDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (dateRange === '7-days') return diffDays >= 0 && diffDays <= 7;
    if (dateRange === '30-days') return diffDays >= 0 && diffDays <= 30;
    if (dateRange === 'quarter') return diffDays >= 0 && diffDays <= 90;
    if (dateRange === 'ytd') return diffDays >= 0 && diffDays <= 365;
    return true;
  };

  // Parse and split the datasets
  const parsedLeadGen = useMemo(() => {
    return leadGenCampaigns.filter(c => isCampaignInDateRange(c.startDate || '2026-09-01'));
  }, [leadGenCampaigns, dateRange]);

  const parsedQualAndInsight = useMemo(() => {
    return qualCampaigns.filter(c => isCampaignInDateRange(c.dateCreated || '2026-09-01'));
  }, [qualCampaigns, dateRange]);

  // Isolate Lead Qual and Customer Insight
  const parsedLeadQual = useMemo(() => {
    return parsedQualAndInsight.filter(c => {
      const tag = c.useCaseTag || '';
      return !['Engagement', 'Retention', 'General Insight'].includes(tag);
    });
  }, [parsedQualAndInsight]);

  const parsedCustomerInsight = useMemo(() => {
    return parsedQualAndInsight.filter(c => {
      const tag = c.useCaseTag || '';
      return ['Engagement', 'Retention', 'General Insight'].includes(tag);
    });
  }, [parsedQualAndInsight]);

  // Combined stats aggregator respecting moduleFilter
  const aggregatedStats = useMemo(() => {
    // 1. Lead Gen variables
    let leadGenActiveCount = 0;
    let leadGenTotalSpend = 0;
    let leadGenTotalLeads = 0;
    let leadGenWithinTarget = 0;
    let leadGenOutsideTarget = 0;
    let leadGenWeightedTargetCACNumerator = 0;
    let leadGenWeightedTargetCACDenominator = 0;

    parsedLeadGen.forEach(c => {
      if (c.status === 'Active' || c.status === 'Completed') {
        leadGenActiveCount++;
      }
      const spend = c.currentSpend || 0;
      const leads = c.leadsAcquired || 0;
      const target = c.targetCAC || 1500;
      
      leadGenTotalSpend += spend;
      leadGenTotalLeads += leads;

      if (spend > 0) {
        leadGenWeightedTargetCACNumerator += target * spend;
        leadGenWeightedTargetCACDenominator += spend;

        const actualCAC = leads > 0 ? spend / leads : 0;
        if (leads > 0) {
          if (actualCAC <= target) {
            leadGenWithinTarget++;
          } else {
            leadGenOutsideTarget++;
          }
        }
      }
    });

    // 2. Lead Qual variables
    let qualActiveCount = 0;
    let qualTotalSpend = 0;
    let qualTotalScored = 0;
    let qualWithinTarget = 0;
    let qualOutsideTarget = 0;
    let qualWeightedTargetCostNumerator = 0;
    let qualWeightedTargetCostDenominator = 0;

    parsedLeadQual.forEach(c => {
      if (c.status === 'Completed' || c.status === 'Processing') {
        qualActiveCount++;
      }
      const spend = c.totalSpend || 0;
      const scored = c.peopleScored || 0;
      const target = c.costTarget || 15; // default target

      qualTotalSpend += spend;
      qualTotalScored += scored;

      if (spend > 0) {
        qualWeightedTargetCostNumerator += target * spend;
        qualWeightedTargetCostDenominator += spend;

        const actualCost = scored > 0 ? spend / scored : 0;
        if (scored > 0) {
          if (actualCost <= target) {
            qualWithinTarget++;
          } else {
            qualOutsideTarget++;
          }
        }
      }
    });

    // 3. Customer Insight variables (shows volume only - no target concepts yet)
    let insightActiveCount = 0;
    let insightTotalSpend = 0;
    let insightTotalProfileed = 0;

    parsedCustomerInsight.forEach(c => {
      if (c.status === 'Completed' || c.status === 'Processing') {
        insightActiveCount++;
      }
      insightTotalSpend += c.totalSpend || 0;
      insightTotalProfileed += c.peopleScored || 0;
    });

    // Calculate rolled-up Targets vs. Actuals
    const rolledUpTargetCAC = leadGenWeightedTargetCACDenominator > 0 
      ? Math.round(leadGenWeightedTargetCACNumerator / leadGenWeightedTargetCACDenominator) 
      : 1500;
    const rolledUpActualCAC = leadGenTotalLeads > 0 
      ? Math.round(leadGenTotalSpend / leadGenTotalLeads) 
      : 0;

    const rolledUpTargetQualCost = qualWeightedTargetCostDenominator > 0 
      ? Number((qualWeightedTargetCostNumerator / qualWeightedTargetCostDenominator).toFixed(2)) 
      : 15;
    const rolledUpActualQualCost = qualTotalScored > 0 
      ? Number((qualTotalSpend / qualTotalScored).toFixed(2)) 
      : 0;

    // Build the "Programs Outside Target" ranked exceptions array (triage-oriented)
    const outsideTargetPrograms: any[] = [];

    // Lead Gen check
    parsedLeadGen.forEach(c => {
      const spend = c.currentSpend || 0;
      const leads = c.leadsAcquired || 0;
      const target = c.targetCAC || 1500;
      const actual = leads > 0 ? Math.round(spend / leads) : 0;
      
      if (leads > 0 && actual > target) {
        const variancePct = ((actual - target) / target) * 100;
        outsideTargetPrograms.push({
          id: c.id,
          name: c.name,
          module: 'Lead Gen',
          metricLabel: 'CAC',
          target: `₹${target.toLocaleString('en-IN')}`,
          actual: `₹${actual.toLocaleString('en-IN')}`,
          variancePct,
          varianceText: `+${Math.round(variancePct)}% variance`,
          spend
        });
      }
    });

    // Lead Qual check
    parsedLeadQual.forEach(c => {
      const spend = c.totalSpend || 0;
      const scored = c.peopleScored || 0;
      const target = c.costTarget || 15;
      const actual = scored > 0 ? Number((spend / scored).toFixed(2)) : 0;

      if (scored > 0 && actual > target) {
        const variancePct = ((actual - target) / target) * 100;
        outsideTargetPrograms.push({
          id: c.id,
          name: c.name,
          module: 'Lead Qualification',
          metricLabel: 'Cost/Score',
          target: `₹${target}`,
          actual: `₹${actual}`,
          variancePct,
          varianceText: `+${Math.round(variancePct)}% variance`,
          spend
        });
      }
    });

    // Sort by severity (variance percentage descending)
    outsideTargetPrograms.sort((a, b) => b.variancePct - a.variancePct);

    // Filter outputs based on the moduleFilter
    const isAll = moduleFilter === 'All';
    const showLeadGen = isAll || moduleFilter === 'Lead Gen';
    const showQual = isAll || moduleFilter === 'Lead Qualification';
    const showInsight = isAll || moduleFilter === 'Customer Insight';

    const consolidatedSpend = 
      (showLeadGen ? leadGenTotalSpend : 0) +
      (showQual ? qualTotalSpend : 0) +
      (showInsight ? insightTotalSpend : 0);

    const consolidatedWithinCount = 
      (showLeadGen ? leadGenWithinTarget : 0) +
      (showQual ? qualWithinTarget : 0);

    const consolidatedOutsideCount = 
      (showLeadGen ? leadGenOutsideTarget : 0) +
      (showQual ? qualOutsideTarget : 0);

    return {
      consolidatedSpend,
      consolidatedWithinCount,
      consolidatedOutsideCount,
      
      leadGenActiveCount,
      leadGenTotalSpend,
      leadGenTotalLeads,
      rolledUpTargetCAC,
      rolledUpActualCAC,
      leadGenOutsideCount: leadGenOutsideTarget,

      qualActiveCount,
      qualTotalSpend,
      qualTotalScored,
      rolledUpTargetQualCost,
      rolledUpActualQualCost,
      qualOutsideCount: qualOutsideTarget,

      insightActiveCount,
      insightTotalSpend,
      insightTotalProfileed,

      outsideTargetPrograms: outsideTargetPrograms.filter(p => {
        if (moduleFilter === 'All') return true;
        return p.module === moduleFilter;
      })
    };
  }, [parsedLeadGen, parsedLeadQual, parsedCustomerInsight, moduleFilter]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 select-none">
      
      {/* Toast Alert feedback */}
      {showToast && (
        <div className="fixed bottom-5 right-5 bg-neutral-900 text-white text-xs py-3 px-4 rounded-xl shadow-xl flex items-center gap-2.5 z-50 animate-in slide-in-from-bottom-2">
          <Check size={14} className="text-emerald-400" />
          <span>{showToast}</span>
        </div>
      )}

      {/* HEADER BAR: Portfolio title, Export Suite */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Operations Control Dashboard
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5 font-medium">
            Zenith Operations Center — Consolidated Multi-Module Reporting & Diagnostics
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-250 rounded-xl shadow-xs transition-all cursor-pointer"
            id="share_btn"
          >
            <Share2 size={13} className="text-neutral-500" />
            <span>Share Dashboard</span>
          </button>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl shadow-xs transition-all cursor-pointer"
            id="export_btn"
          >
            <Download size={13} />
            <span>Export View</span>
          </button>
        </div>
      </div>



      {/* PRIMARY STAT TILES ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat Tile 1: Programs Within / Outside Target (Consolidated Headline) */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Consolidated Diagnostics</span>
            <h3 className="text-sm font-semibold text-neutral-800">Target Pacing Audit</h3>
          </div>
          
          <div className="my-3 flex items-baseline gap-2.5">
            <span className="text-2xl font-black text-neutral-900">
              {aggregatedStats.consolidatedWithinCount + aggregatedStats.consolidatedOutsideCount} <span className="text-xs text-neutral-400 font-medium">total evaluated</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {aggregatedStats.consolidatedWithinCount} Within Target
            </span>
            {aggregatedStats.consolidatedOutsideCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {aggregatedStats.consolidatedOutsideCount} Outside Target
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-50 text-neutral-500 border border-neutral-150">
                0 Outside Target
              </span>
            )}
          </div>
        </div>

        {/* Stat Tile 2: Lead Gen CAC Performance */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Lead Generation</span>
            <h3 className="text-sm font-semibold text-neutral-800">Actual vs Target CAC</h3>
          </div>
          
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-neutral-900">₹{aggregatedStats.rolledUpActualCAC.toLocaleString('en-IN')}</span>
              <span className="text-xs text-neutral-400 font-medium">vs ₹{aggregatedStats.rolledUpTargetCAC.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1 leading-snug">
              * Rollup utilizes the spend-weighted average of campaign targets.
            </p>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-bold">
            {aggregatedStats.rolledUpActualCAC <= aggregatedStats.rolledUpTargetCAC ? (
              <span className="text-emerald-600 flex items-center gap-0.5">
                <TrendingDown size={11} /> Under target cap (Efficient)
              </span>
            ) : (
              <span className="text-rose-600 flex items-center gap-0.5">
                <TrendingUp size={11} /> Over target threshold (Needs review)
              </span>
            )}
          </div>
        </div>

        {/* Stat Tile 3: Lead Qualification Cost target */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Lead Qualification</span>
            <h3 className="text-sm font-semibold text-neutral-800">Scoring Cost Target</h3>
          </div>
          
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-neutral-900">₹{aggregatedStats.rolledUpActualQualCost.toFixed(2)}</span>
              <span className="text-xs text-neutral-400 font-medium">vs ₹{aggregatedStats.rolledUpTargetQualCost.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1 leading-snug">
              * Unit-cost per roster row validated, scrubbed & scored.
            </p>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-bold">
            {aggregatedStats.rolledUpActualQualCost <= aggregatedStats.rolledUpTargetQualCost ? (
              <span className="text-emerald-600 flex items-center gap-0.5">
                <Check size={11} /> Within operational parameters
              </span>
            ) : (
              <span className="text-rose-600 flex items-center gap-0.5">
                <AlertTriangle size={11} /> Higher bureau friction
              </span>
            )}
          </div>
        </div>

        {/* Stat Tile 4: Consolidated actual spend */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Consolidated Ledger</span>
            <h3 className="text-sm font-semibold text-neutral-800">Total Operational Spend</h3>
          </div>
          
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-neutral-900">₹{aggregatedStats.consolidatedSpend.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1 leading-snug">
              * Sum of active media spends & list-scoring database costs.
            </p>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 border-t border-neutral-100 pt-1.5 mt-1">
            <span>Spend Status: Verified</span>
            <span className="text-blue-600">Ledger Audited</span>
          </div>
        </div>

      </div>

      {/* VOLUME SNAPSHOT PANEL (Individual Engine Volume breakdown) */}
      <div className="bg-white border border-neutral-250 rounded-xl p-4 shadow-xs">
        <h3 className="text-[10.5px] font-bold text-neutral-400 uppercase tracking-wider font-mono mb-3.5 select-none">
          Unified Volume Diagnostics Segment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Box 1: Lead Gen Volume */}
          <div className="bg-neutral-50 border border-neutral-150 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Leads Delivered (Lead Gen)</span>
              <strong className="text-xl font-black text-neutral-900 block mt-1">
                {aggregatedStats.leadGenTotalLeads.toLocaleString('en-IN')} <span className="text-xs font-normal text-neutral-400">leads</span>
              </strong>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target size={15} />
            </div>
          </div>

          {/* Box 2: Lead Qual Volume */}
          <div className="bg-neutral-50 border border-neutral-150 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">People Scored (Lead Qual)</span>
              <strong className="text-xl font-black text-neutral-900 block mt-1">
                {aggregatedStats.qualTotalScored.toLocaleString('en-IN')} <span className="text-xs font-normal text-neutral-400">profiles</span>
              </strong>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={15} />
            </div>
          </div>

          {/* Box 3: Customer Insight Volume (Volume only, no target) */}
          <div className="bg-neutral-50 border border-neutral-150 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">People Profiled (Insights)</span>
              <strong className="text-xl font-black text-neutral-900 block mt-1">
                {aggregatedStats.insightTotalProfileed.toLocaleString('en-IN')} <span className="text-xs font-normal text-neutral-400">profiled</span>
              </strong>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users size={15} />
            </div>
          </div>

        </div>
      </div>

      {/* CORE OPERATIONAL ANALYSIS LAYOUT: Actionable Ranked Exceptions & Trend Lines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ACTIONABLE EXCEPTIONS TABLE: Programs Outside Target (Sorted descending by variance) */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4 select-none">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-rose-500" />
                <h3 className="text-sm font-semibold text-neutral-900">
                  Target Discrepancy Diagnostics (Triage Focus)
                </h3>
              </div>
              <span className="text-[9.5px] font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md font-bold">
                SORTED BY DEVIATION SEVERITY
              </span>
            </div>
            
            <p className="text-xs text-neutral-500 mb-4 select-none">
              Cross-module list of campaigns exceeding unit target costs, ranked from highest variance to lowest. Highlighted for fast triage.
            </p>

            {aggregatedStats.outsideTargetPrograms.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 text-[10px] font-mono uppercase text-neutral-400 pb-2">
                      <th className="pb-2">Campaign & Engine</th>
                      <th className="pb-2">Target</th>
                      <th className="pb-2">Actual</th>
                      <th className="pb-2 text-right">Variance Deviation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {aggregatedStats.outsideTargetPrograms.map(p => (
                      <tr key={p.id} className="hover:bg-neutral-50/50">
                        <td className="py-3">
                          <div className="space-y-0.5">
                            <strong className="text-neutral-900 font-extrabold text-xs">{p.name}</strong>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm ${p.module === 'Lead Gen' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {p.module.toUpperCase()}
                              </span>
                              <span className="text-[9.5px] text-neutral-400 font-mono">{p.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-semibold text-neutral-600">{p.target}</td>
                        <td className="py-3 font-bold text-neutral-900">{p.actual}</td>
                        <td className="py-3 text-right">
                          <span className="inline-flex items-center gap-0.5 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md text-[10.5px]">
                            <TrendingUp size={11} /> {p.varianceText}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-neutral-400 text-xs">
                <Check size={20} className="mx-auto text-emerald-500 mb-2" />
                No campaigns are exceeding their target parameters in the selected timeframe.
              </div>
            )}
          </div>

          <div className="border-t border-neutral-100 pt-3 mt-4 text-right">
            <button
              onClick={() => setActiveSection('management')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Manage active campaigns</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>

        {/* MULTI-SERIES TARGET VS ACTUAL CHART OVER TIME */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 select-none">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-neutral-500" />
                <h3 className="text-sm font-semibold text-neutral-900">
                  Target vs. Actual Cost Trends
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                MONTHLY PROGRESS
              </span>
            </div>

            <p className="text-xs text-neutral-500 select-none">
              Consolidated, spend-weighted cost efficiency trajectories for Lead Generation (CAC) and Lead Qualification (Validation Cost).
            </p>
          </div>

          {/* Inline SVG Chart */}
          <div className="mt-4 relative">
            <svg className="w-full h-36" viewBox="0 0 450 140" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="30" y1="20" x2="430" y2="20" stroke="#f4f4f5" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="30" y1="55" x2="430" y2="55" stroke="#f4f4f5" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="30" y1="90" x2="430" y2="90" stroke="#f4f4f5" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="30" y1="120" x2="430" y2="120" stroke="#e5e7eb" strokeWidth="1" />

              {/* Y Axis labels (Dual axis representation) */}
              <text x="15" y="24" className="text-[8px] fill-neutral-400 font-mono" textAnchor="end">₹3.5K / ₹35</text>
              <text x="15" y="59" className="text-[8px] fill-neutral-400 font-mono" textAnchor="end">₹2.0K / ₹20</text>
              <text x="15" y="94" className="text-[8px] fill-neutral-400 font-mono" textAnchor="end">₹1.0K / ₹10</text>

              {/* X Axis */}
              <text x="65" y="132" className="text-[9px] fill-neutral-500 font-medium font-mono" textAnchor="middle">May</text>
              <text x="155" y="132" className="text-[9px] fill-neutral-500 font-medium font-mono" textAnchor="middle">Jun</text>
              <text x="245" y="132" className="text-[9px] fill-neutral-500 font-medium font-mono" textAnchor="middle">Jul</text>
              <text x="335" y="132" className="text-[9px] fill-neutral-500 font-medium font-mono" textAnchor="middle">Aug</text>
              <text x="415" y="132" className="text-[9px] fill-neutral-500 font-bold text-blue-600 font-mono" textAnchor="middle">Sep</text>

              {/* Line 1: Target CAC (Dashed blue) */}
              <path d="M 65,55 L 155,55 L 245,55 L 335,55 L 415,55" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4,4" />
              {/* Line 2: Actual CAC (Solid blue) */}
              <path d="M 65,70 L 155,62 L 245,45 L 335,40 L 415,35" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />

              {/* Line 3: Target Qual Cost (Dashed emerald) */}
              <path d="M 65,90 L 155,90 L 245,90 L 335,90 L 415,90" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4,4" />
              {/* Line 4: Actual Qual Cost (Solid emerald) */}
              <path d="M 65,105 L 155,98 L 245,85 L 335,82 L 415,75" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />

              {/* Data Node Points (Active Month) */}
              <circle cx="415" cy="35" r="4.5" fill="#2563eb" stroke="white" strokeWidth="1.5" />
              <circle cx="415" cy="75" r="4.5" fill="#10b981" stroke="white" strokeWidth="1.5" />
            </svg>

            {/* Custom Multi-Series Legend */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-2 pt-2 border-t border-neutral-100 select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-blue-600 inline-block" />
                <span className="text-[10px] text-neutral-600 font-semibold">Actual CAC (Lead Gen)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 border-t border-dashed border-blue-600 inline-block" />
                <span className="text-[10px] text-neutral-500">Target CAC (Lead Gen)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-emerald-500 inline-block" />
                <span className="text-[10px] text-neutral-600 font-semibold">Actual Cost/Score (Lead Qual)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 border-t border-dashed border-emerald-500 inline-block" />
                <span className="text-[10px] text-neutral-500">Target Cost/Score (Lead Qual)</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* THREE INTERACTIVE DRILL-THROUGH MODULE CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Module 1: Lead Gen Drill Card */}
        <div 
          onClick={() => setActiveSection('leadgen-dashboard')}
          className="bg-white border border-neutral-200 hover:border-blue-300 rounded-xl p-5 shadow-xs cursor-pointer group flex flex-col justify-between transition-all hover:shadow-md"
        >
          <div>
            <div className="flex items-center justify-between mb-3 select-none">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Target size={16} />
                </div>
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Module 1</h4>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                Active <ArrowUpRight size={10} />
              </span>
            </div>

            <h3 className="text-base font-extrabold text-neutral-900 group-hover:text-blue-600 transition-colors">
              Lead Generation Dashboard
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Consolidated tracking of prospective client acquisition channels, active landing pages, and ongoing media campaigns.
            </p>
          </div>

          <div className="border-t border-neutral-100 pt-3 mt-4 flex items-center justify-between text-xs font-bold">
            <span className="text-neutral-700">₹{(aggregatedStats.leadGenTotalSpend / 100000).toFixed(1)}L Spent</span>
            <span className="text-blue-600 flex items-center gap-0.5 group-hover:underline">
              View Engine dashboard <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Module 2: Lead Qual Drill Card */}
        <div 
          onClick={() => setActiveSection('qual-dashboard')}
          className="bg-white border border-neutral-200 hover:border-emerald-300 rounded-xl p-5 shadow-xs cursor-pointer group flex flex-col justify-between transition-all hover:shadow-md"
        >
          <div>
            <div className="flex items-center justify-between mb-3 select-none">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Module 2</h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                Online <ArrowUpRight size={10} />
              </span>
            </div>

            <h3 className="text-base font-extrabold text-neutral-900 group-hover:text-emerald-600 transition-colors">
              Lead Qualification Dashboard
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Validate incoming leads against strict credit criteria and model scoring weights before sales team handoff.
            </p>
          </div>

          <div className="border-t border-neutral-100 pt-3 mt-4 flex items-center justify-between text-xs font-bold">
            <span className="text-neutral-700">{aggregatedStats.qualTotalScored.toLocaleString('en-IN')} Scored</span>
            <span className="text-emerald-600 flex items-center gap-0.5 group-hover:underline">
              View Engine dashboard <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Module 3: Customer Insight Drill Card */}
        <div 
          onClick={() => setActiveSection('insight-dashboard')}
          className="bg-white border border-neutral-200 hover:border-indigo-300 rounded-xl p-5 shadow-xs cursor-pointer group flex flex-col justify-between transition-all hover:shadow-md"
        >
          <div>
            <div className="flex items-center justify-between mb-3 select-none">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Module 3</h4>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                Ready <ArrowUpRight size={10} />
              </span>
            </div>

            <h3 className="text-base font-extrabold text-neutral-900 group-hover:text-indigo-600 transition-colors">
              Customer Insight Dashboard
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Unlock the deep psychological profile vectors, motivation mappings, and psychometric clusters of key client cohorts.
            </p>
          </div>

          <div className="border-t border-neutral-100 pt-3 mt-4 flex items-center justify-between text-xs font-bold">
            <span className="text-neutral-700">{aggregatedStats.insightTotalProfileed.toLocaleString('en-IN')} Profiled</span>
            <span className="text-indigo-600 flex items-center gap-0.5 group-hover:underline">
              View Engine dashboard <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

      </div>

      {/* RECENT OPERATIONAL LOGS & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RECENT CHRONOLOGICAL ACTIVITY (Cross-module version of recent campaign events) */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3.5 mb-3.5 select-none">
            <div className="flex items-center gap-2">
              <History size={15} className="text-neutral-500" />
              <h3 className="text-sm font-semibold text-neutral-900">
                Recent Cross-Engine Operations Log
              </h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">
              CHRONOLOGICAL EVENTS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-[9.5px] font-mono uppercase tracking-wider text-neutral-400 pb-1.5">
                  <th className="pb-2">Engine</th>
                  <th className="pb-2">Operation & Description</th>
                  <th className="pb-2 text-right">Operational State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <tr className="hover:bg-neutral-50/40">
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[8.5px] font-bold bg-blue-50 text-blue-700 font-mono">
                      LEAD GEN
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="space-y-0.5">
                      <strong className="text-neutral-800 font-bold block">Campaign "Festive Season Push" budget audit</strong>
                      <span className="text-neutral-500 block">System validated ₹12.5L cumulative spend against target parameters.</span>
                    </div>
                  </td>
                  <td className="py-3 text-right font-mono text-[10.5px] text-neutral-400">
                    Today, 10:15 AM
                  </td>
                </tr>
                <tr className="hover:bg-neutral-50/40">
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[8.5px] font-bold bg-emerald-50 text-emerald-700 font-mono">
                      QUALIFICATION
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="space-y-0.5">
                      <strong className="text-neutral-800 font-bold block">Processed "HNIs North Region" roster</strong>
                      <span className="text-neutral-500 block">4,800 records evaluated for wealth advisory eligibility scoring.</span>
                    </div>
                  </td>
                  <td className="py-3 text-right font-mono text-[10.5px] text-neutral-400">
                    Sep 15, 03:30 PM
                  </td>
                </tr>
                <tr className="hover:bg-neutral-50/40">
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[8.5px] font-bold bg-indigo-50 text-indigo-700 font-mono">
                      INSIGHTS
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="space-y-0.5">
                      <strong className="text-neutral-800 font-bold block">Generated "Mass Affluent" psychological index</strong>
                      <span className="text-neutral-500 block">3,400 survey rosters indexed into structural OCEAN clusters.</span>
                    </div>
                  </td>
                  <td className="py-3 text-right font-mono text-[10.5px] text-neutral-400">
                    Sep 14, 09:05 AM
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* QUICK ACTION PANEL */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono border-b border-neutral-200 pb-2 select-none">
              Quick launch suite
            </h3>
            
            <p className="text-xs text-neutral-500 leading-relaxed select-none">
              Direct entry channels to launch fresh campaigns, score list rosters, or map psychological segments.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => setActiveSection('builder')}
                className="w-full flex items-center justify-between p-2.5 bg-white border border-neutral-200 hover:border-blue-350 hover:bg-blue-50/20 text-neutral-800 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group"
              >
                <span>Launch Lead Gen Campaign</span>
                <ArrowRight size={13} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setActiveSection('qual-builder')}
                className="w-full flex items-center justify-between p-2.5 bg-white border border-neutral-200 hover:border-emerald-350 hover:bg-emerald-50/20 text-neutral-800 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group"
              >
                <span>Score Qualification Roster</span>
                <ArrowRight size={13} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setActiveSection('insight-builder')}
                className="w-full flex items-center justify-between p-2.5 bg-white border border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50/20 text-neutral-800 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group"
              >
                <span>Map Psychological Insights</span>
                <ArrowRight size={13} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-3 mt-4 text-[10px] text-neutral-400 leading-normal select-none">
            Consolidated reporting data updates dynamically from encrypted storage modules upon action execution.
          </div>
        </div>

      </div>

    </div>
  );
};
