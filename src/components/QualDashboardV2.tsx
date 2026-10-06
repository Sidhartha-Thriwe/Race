import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ShieldCheck, 
  BarChart3, 
  Layers, 
  MapPin, 
  UserCheck, 
  FolderKanban,
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Flame
} from 'lucide-react';
import { DashboardPeriod } from './AdminPanel';

export type QualSliceDimension = 'campaign' | 'category' | 'geography' | 'persona';

export interface QualSliceRowItem {
  id: string;
  name: string;
  subtext?: string;
  targetCQC: number;
  actualCQC: number;
  prospectsQualified: number;
  highConfidencePercent: number;
  budgetConsumed: number;
  budgetLeft: number;
  statusBadge?: string;
}

interface QualDashboardV2Props {
  selectedPeriod: DashboardPeriod;
  onNewCampaign?: () => void;
  onNavigateToManagement?: (filter?: string) => void;
}

export const QualDashboardV2: React.FC<QualDashboardV2Props> = ({
  selectedPeriod,
  onNewCampaign,
  onNavigateToManagement
}) => {
  const [activeSlice, setActiveSlice] = useState<QualSliceDimension>('campaign');
  const [searchQuery, setSearchQuery] = useState('');
  const [cqcFilter, setCqcFilter] = useState<'all' | 'within' | 'outside'>('all');

  // Multiplier based on period for realistic figures
  const periodMultiplier = useMemo(() => {
    switch (selectedPeriod) {
      case 'Last week':
        return 0.88;
      case 'This month':
        return 3.9;
      case 'Year to date':
        return 19.2;
      case 'This week':
      default:
        return 1.0;
    }
  }, [selectedPeriod]);

  // Format currency in Indian numbering (Lakh / K / Cr or raw)
  const formatCurrency = (val: number): string => {
    if (val >= 10000000) {
      const cr = val / 10000000;
      return `₹${cr.toFixed(2).replace(/\.00$/, '')}Cr`;
    }
    if (val >= 100000) {
      const l = (val / 100000).toFixed(val % 100000 === 0 || val % 10000 === 0 ? 1 : 2).replace(/\.0$/, '');
      return `₹${l}L`;
    }
    if (val >= 1000) {
      const k = (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1);
      return `₹${k}K`;
    }
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  const formatNumber = (val: number): string => {
    return Math.round(val).toLocaleString('en-IN');
  };

  // 1. Compute Top 4 Cards Across All Campaigns for Current Date Range
  const cardMetrics = useMemo(() => {
    // Base figures for "This week"
    const baseProspectsQualified = 12480;
    const baseHighConfVolume = 5460;
    const targetCQC = 45;
    let actualCQC = 42;
    let highConfCost = 96;
    const campaignScore = '4.1 / 5';
    const unqualifiableRate = 11.2;
    const uploadedRowsProcessed = 84;
    const flaggedCampaignsCount = 2;

    if (selectedPeriod === 'Last week') {
      actualCQC = 43;
      highConfCost = 98;
    } else if (selectedPeriod === 'This month') {
      actualCQC = 41;
      highConfCost = 94;
    } else if (selectedPeriod === 'Year to date') {
      actualCQC = 40;
      highConfCost = 92;
    }

    const totalProspects = Math.round(baseProspectsQualified * periodMultiplier);
    const highConfVolume = Math.round(baseHighConfVolume * periodMultiplier);

    // Budget consumed till date & daily burn rate
    // Base: ₹12.6L till date, ₹1.8L/day
    const baseBudgetConsumedTillDate = 1260000;
    const totalBudgetConsumed = Math.round(baseBudgetConsumedTillDate * (selectedPeriod === 'This week' ? 1.0 : periodMultiplier * 0.95));
    const dailyBurnRate = selectedPeriod === 'This week' 
      ? 180000 
      : Math.round(totalBudgetConsumed / (selectedPeriod === 'This month' ? 30 : selectedPeriod === 'Year to date' ? 180 : 7));

    return {
      northstar: {
        primaryLabel: 'Customer Qualification Cost',
        primarySub: 'Cost of qualifying a single prospect',
        primaryVal: `₹${actualCQC}`,
        primaryUnit: '/ prospect',
        secondaryLabel: 'Cost per High Confidence qualification',
        secondaryVal: `₹${highConfCost}`,
        secondaryUnit: 'per High Conf. qual',
        targetNote: `Target: ₹${targetCQC}`,
        isFavorable: actualCQC <= targetCQC,
        trend: '-6.7% vs target'
      },
      guardrail1: {
        primaryLabel: 'Prospects Qualified',
        primarySub: 'Total prospects processed and scored from uploaded files',
        primaryVal: `${formatNumber(totalProspects)} total`,
        primaryUnit: 'processed & scored',
        secondaryLabel: 'High Confidence qualification volume',
        secondaryVal: formatNumber(highConfVolume),
        secondaryUnit: `${((highConfVolume / totalProspects) * 100).toFixed(1)}% of total`,
        targetNote: 'Cap: Upload file',
        footerText: `${uploadedRowsProcessed}% of uploaded rows processed`,
        isFavorable: true
      },
      guardrail2: {
        primaryLabel: 'Campaign Performance',
        primarySub: 'Average qualification score across active campaigns',
        primaryVal: campaignScore,
        primaryUnit: 'Avg campaign score',
        secondaryLabel: 'Unqualifiable rate',
        secondaryVal: `${unqualifiableRate}%`,
        secondaryUnit: 'insufficient data / no confident match',
        warningText: `${flaggedCampaignsCount} campaigns flagged for review`
      },
      burnAndBudget: {
        primaryLabel: 'Daily Burn Rate',
        primarySub: 'Average qualification spend per day',
        primaryVal: `${formatCurrency(dailyBurnRate)} / day`,
        primaryUnit: '/ day',
        secondaryLabel: 'Budget consumed till date',
        secondaryVal: formatCurrency(totalBudgetConsumed),
        secondaryUnit: 'total spend',
        paceStatus: 'Within planned pace',
        targetNote: 'Target pace'
      }
    };
  }, [selectedPeriod, periodMultiplier]);

  // 2. Raw datasets for the 4 Slices (recalculated with multiplier)
  const rawSliceData = useMemo<Record<QualSliceDimension, QualSliceRowItem[]>>(() => {
    // Campaign slice (matches 12,480 total prospects and ₹42 blended CQC)
    const campaignItems: QualSliceRowItem[] = [
      {
        id: 'qual-camp-1',
        name: 'HNI Wealth Qualification Q3',
        subtext: 'Premium Banking · Affluent Investors',
        targetCQC: 45,
        actualCQC: 42,
        prospectsQualified: Math.round(3200 * periodMultiplier),
        highConfidencePercent: 52.0,
        budgetConsumed: Math.round(134400 * periodMultiplier),
        budgetLeft: Math.round(115600 * periodMultiplier),
        statusBadge: 'Active'
      },
      {
        id: 'qual-camp-2',
        name: 'Credit Card Upgrade Evaluator',
        subtext: 'Cards & Retail · Urban Professionals',
        targetCQC: 38,
        actualCQC: 35,
        prospectsQualified: Math.round(4100 * periodMultiplier),
        highConfidencePercent: 44.0,
        budgetConsumed: Math.round(143500 * periodMultiplier),
        budgetLeft: Math.round(106500 * periodMultiplier),
        statusBadge: 'Active'
      },
      {
        id: 'qual-camp-3',
        name: 'SME Business Loan Pipeline',
        subtext: 'Business Lending · Business Owners',
        targetCQC: 55,
        actualCQC: 63,
        prospectsQualified: Math.round(1840 * periodMultiplier),
        highConfidencePercent: 35.0,
        budgetConsumed: Math.round(115920 * periodMultiplier),
        budgetLeft: Math.round(34080 * periodMultiplier),
        statusBadge: 'Active'
      },
      {
        id: 'qual-camp-4',
        name: 'Salaried Personal Loan Screening',
        subtext: 'Consumer Credit · Salaried Executives',
        targetCQC: 35,
        actualCQC: 32,
        prospectsQualified: Math.round(2120 * periodMultiplier),
        highConfidencePercent: 40.0,
        budgetConsumed: Math.round(67840 * periodMultiplier),
        budgetLeft: Math.round(82160 * periodMultiplier),
        statusBadge: 'Active'
      },
      {
        id: 'qual-camp-5',
        name: 'High-Value Auto Loan Verification',
        subtext: 'Auto Finance · Emerging Affluent',
        targetCQC: 48,
        actualCQC: 54,
        prospectsQualified: Math.round(900 * periodMultiplier),
        highConfidencePercent: 38.0,
        budgetConsumed: Math.round(48600 * periodMultiplier),
        budgetLeft: Math.round(31400 * periodMultiplier),
        statusBadge: 'Active'
      },
      {
        id: 'qual-camp-6',
        name: 'NRI Priority Banking Eligibility',
        subtext: 'Wealth Management · Global NRIs',
        targetCQC: 60,
        actualCQC: 56,
        prospectsQualified: Math.round(320 * periodMultiplier),
        highConfidencePercent: 50.0,
        budgetConsumed: Math.round(17920 * periodMultiplier),
        budgetLeft: Math.round(82080 * periodMultiplier),
        statusBadge: 'Paused'
      }
    ];

    // Category slice
    const categoryItems: QualSliceRowItem[] = [
      {
        id: 'qual-cat-1',
        name: 'Cards & Retail Banking',
        subtext: 'Card upgrades, limits & rewards tier scoring',
        targetCQC: 38,
        actualCQC: 35,
        prospectsQualified: Math.round(4100 * periodMultiplier),
        highConfidencePercent: 44.0,
        budgetConsumed: Math.round(143500 * periodMultiplier),
        budgetLeft: Math.round(106500 * periodMultiplier)
      },
      {
        id: 'qual-cat-2',
        name: 'Premium & Wealth Banking',
        subtext: 'Private banking & HNI wealth qualification',
        targetCQC: 46,
        actualCQC: 43,
        prospectsQualified: Math.round(3520 * periodMultiplier),
        highConfidencePercent: 51.8,
        budgetConsumed: Math.round(151360 * periodMultiplier),
        budgetLeft: Math.round(197680 * periodMultiplier)
      },
      {
        id: 'qual-cat-3',
        name: 'Consumer Credit & Personal Loans',
        subtext: 'Unsecured instant personal credit qualification',
        targetCQC: 35,
        actualCQC: 32,
        prospectsQualified: Math.round(2120 * periodMultiplier),
        highConfidencePercent: 40.0,
        budgetConsumed: Math.round(67840 * periodMultiplier),
        budgetLeft: Math.round(82160 * periodMultiplier)
      },
      {
        id: 'qual-cat-4',
        name: 'Business & Commercial Lending',
        subtext: 'Working capital & term loan business qualification',
        targetCQC: 55,
        actualCQC: 63,
        prospectsQualified: Math.round(1840 * periodMultiplier),
        highConfidencePercent: 35.0,
        budgetConsumed: Math.round(115920 * periodMultiplier),
        budgetLeft: Math.round(34080 * periodMultiplier)
      },
      {
        id: 'qual-cat-5',
        name: 'Auto & Asset Finance',
        subtext: 'High-value passenger vehicle loan verification',
        targetCQC: 48,
        actualCQC: 54,
        prospectsQualified: Math.round(900 * periodMultiplier),
        highConfidencePercent: 38.0,
        budgetConsumed: Math.round(48600 * periodMultiplier),
        budgetLeft: Math.round(31400 * periodMultiplier)
      }
    ];

    // Geography slice
    const geographyItems: QualSliceRowItem[] = [
      {
        id: 'qual-geo-1',
        name: 'Mumbai MMR',
        subtext: 'Financial Capital & Coastal Suburbs',
        targetCQC: 44,
        actualCQC: 41,
        prospectsQualified: Math.round(3840 * periodMultiplier),
        highConfidencePercent: 52.0,
        budgetConsumed: Math.round(157440 * periodMultiplier),
        budgetLeft: Math.round(142560 * periodMultiplier)
      },
      {
        id: 'qual-geo-2',
        name: 'Delhi NCR',
        subtext: 'Gurugram, Noida, South Delhi & Central',
        targetCQC: 43,
        actualCQC: 40,
        prospectsQualified: Math.round(3360 * periodMultiplier),
        highConfidencePercent: 46.0,
        budgetConsumed: Math.round(134400 * periodMultiplier),
        budgetLeft: Math.round(115600 * periodMultiplier)
      },
      {
        id: 'qual-geo-3',
        name: 'Bengaluru Tech Corridor',
        subtext: 'Whitefield, Koramangala, Indiranagar',
        targetCQC: 42,
        actualCQC: 39,
        prospectsQualified: Math.round(2520 * periodMultiplier),
        highConfidencePercent: 48.0,
        budgetConsumed: Math.round(98280 * periodMultiplier),
        budgetLeft: Math.round(91720 * periodMultiplier)
      },
      {
        id: 'qual-geo-4',
        name: 'Hyderabad & Pune Cluster',
        subtext: 'HITEC City, Gachibowli, Baner & Hinjewadi',
        targetCQC: 40,
        actualCQC: 38,
        prospectsQualified: Math.round(1820 * periodMultiplier),
        highConfidencePercent: 40.0,
        budgetConsumed: Math.round(69160 * periodMultiplier),
        budgetLeft: Math.round(50840 * periodMultiplier)
      },
      {
        id: 'qual-geo-5',
        name: 'Chennai & Kolkata Metro',
        subtext: 'Old Corporate & Port Commercial Hubs',
        targetCQC: 46,
        actualCQC: 51,
        prospectsQualified: Math.round(940 * periodMultiplier),
        highConfidencePercent: 32.0,
        budgetConsumed: Math.round(47940 * periodMultiplier),
        budgetLeft: Math.round(22060 * periodMultiplier)
      }
    ];

    // Persona slice
    const personaItems: QualSliceRowItem[] = [
      {
        id: 'qual-per-1',
        name: 'Corporate & Tech Professionals',
        subtext: '₹18L-₹40L CTC, high disposable salary tier',
        targetCQC: 38,
        actualCQC: 35,
        prospectsQualified: Math.round(4100 * periodMultiplier),
        highConfidencePercent: 44.0,
        budgetConsumed: Math.round(143500 * periodMultiplier),
        budgetLeft: Math.round(106500 * periodMultiplier)
      },
      {
        id: 'qual-per-2',
        name: 'Affluent Investors & HNIs',
        subtext: '₹50L+ portfolio or liquid capital balance',
        targetCQC: 48,
        actualCQC: 44,
        prospectsQualified: Math.round(3200 * periodMultiplier),
        highConfidencePercent: 54.0,
        budgetConsumed: Math.round(140800 * periodMultiplier),
        budgetLeft: Math.round(109200 * periodMultiplier)
      },
      {
        id: 'qual-per-3',
        name: 'Mid-Level Salaried Executives',
        subtext: '₹8L-₹18L CTC with stable banking relationship',
        targetCQC: 35,
        actualCQC: 32,
        prospectsQualified: Math.round(2120 * periodMultiplier),
        highConfidencePercent: 40.0,
        budgetConsumed: Math.round(67840 * periodMultiplier),
        budgetLeft: Math.round(82160 * periodMultiplier)
      },
      {
        id: 'qual-per-4',
        name: 'SME Business Owners & Traders',
        subtext: '₹2Cr-₹20Cr annual registered turnover',
        targetCQC: 55,
        actualCQC: 63,
        prospectsQualified: Math.round(1840 * periodMultiplier),
        highConfidencePercent: 35.0,
        budgetConsumed: Math.round(115920 * periodMultiplier),
        budgetLeft: Math.round(34080 * periodMultiplier)
      },
      {
        id: 'qual-per-5',
        name: 'Emerging Young Affluent',
        subtext: 'First-time luxury & premium fintech adopters',
        targetCQC: 46,
        actualCQC: 52,
        prospectsQualified: Math.round(900 * periodMultiplier),
        highConfidencePercent: 38.0,
        budgetConsumed: Math.round(46800 * periodMultiplier),
        budgetLeft: Math.round(33200 * periodMultiplier)
      },
      {
        id: 'qual-per-6',
        name: 'Global NRIs & Cross-Border Earners',
        subtext: 'NRE/NRO remittances & overseas assets',
        targetCQC: 60,
        actualCQC: 56,
        prospectsQualified: Math.round(320 * periodMultiplier),
        highConfidencePercent: 50.0,
        budgetConsumed: Math.round(17920 * periodMultiplier),
        budgetLeft: Math.round(82080 * periodMultiplier)
      }
    ];

    return {
      campaign: campaignItems,
      category: categoryItems,
      geography: geographyItems,
      persona: personaItems
    };
  }, [periodMultiplier]);

  // Dynamic search placeholder based on active slice tab
  const searchPlaceholder = useMemo(() => {
    switch (activeSlice) {
      case 'campaign':
        return 'Filter campaign…';
      case 'category':
        return 'Filter category…';
      case 'geography':
        return 'Filter geography…';
      case 'persona':
        return 'Filter persona…';
      default:
        return 'Filter…';
    }
  }, [activeSlice]);

  // Active items filtered by search and CQC within/outside target
  const currentItems = useMemo(() => {
    let items = rawSliceData[activeSlice];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        i => i.name.toLowerCase().includes(q) || (i.subtext && i.subtext.toLowerCase().includes(q))
      );
    }

    if (cqcFilter === 'within') {
      items = items.filter(i => i.actualCQC <= i.targetCQC);
    } else if (cqcFilter === 'outside') {
      items = items.filter(i => i.actualCQC > i.targetCQC);
    }

    return items;
  }, [rawSliceData, activeSlice, searchQuery, cqcFilter]);

  // Aggregate stats for the current slice table (recalculates on filtered items)
  const tableSummary = useMemo(() => {
    const items = currentItems;
    const totalProspects = items.reduce((acc, curr) => acc + curr.prospectsQualified, 0);
    const totalBudgetConsumed = items.reduce((acc, curr) => acc + curr.budgetConsumed, 0);
    const totalBudgetLeft = items.reduce((acc, curr) => acc + curr.budgetLeft, 0);
    
    // Blended actual CQC: total budget consumed / total prospects qualified
    const blendedActualCQC = totalProspects > 0 ? Math.round(totalBudgetConsumed / totalProspects) : 0;
    
    // Average target CQC
    const avgTargetCQC = items.length > 0 
      ? Math.round(items.reduce((acc, curr) => acc + curr.targetCQC, 0) / items.length) 
      : 0;
    
    // Blended % high confidence
    const blendedHighConf = totalProspects > 0
      ? (items.reduce((acc, curr) => acc + (curr.highConfidencePercent * curr.prospectsQualified), 0) / totalProspects)
      : 0;

    return {
      totalProspects,
      totalBudgetConsumed,
      totalBudgetLeft,
      blendedActualCQC,
      avgTargetCQC,
      blendedHighConf,
      rowCount: items.length
    };
  }, [currentItems]);

  const sliceTabs: { key: QualSliceDimension; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { key: 'campaign', label: 'By Campaign', icon: FolderKanban },
    { key: 'category', label: 'By Product Category', icon: Layers },
    { key: 'geography', label: 'By Geography', icon: MapPin },
    { key: 'persona', label: 'By Persona', icon: UserCheck }
  ];

  return (
    <div className="space-y-6 pb-16 font-sans select-none" id="qual-dashboard-v2-container">
      
      {/* TOP ROW: 4 STAT TILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="qual-v2-stat-cards-grid">
        
        {/* Card 1: Northstar card (Customer Qualification Cost) */}
        <div 
          className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-neutral-300 transition-all group"
          id="qual-v2-northstar-card"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold text-neutral-800">
                {cardMetrics.northstar.primaryLabel}
              </h3>
              <Target size={15} className="text-[#2563eb]" />
            </div>

            {/* Primary Metric (Headline Figure) */}
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tracking-tight text-neutral-900">
                  {cardMetrics.northstar.primaryVal}
                </span>
                <span className="text-xs text-neutral-500 font-semibold">
                  {cardMetrics.northstar.primaryUnit}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Metric (Cost per High Confidence qualification) */}
          <div className="mt-4 pt-3 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 font-medium text-[11px]">
                {cardMetrics.northstar.secondaryLabel}
              </span>
              <span className="font-bold text-neutral-900 text-xs">
                {cardMetrics.northstar.secondaryVal}
              </span>
            </div>
            {/* Footer row: % vs target on left, Target: ₹45 on right */}
            <div className="mt-1.5 flex items-center justify-between text-[10.5px]">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                <TrendingDown size={12} />
                <span>{cardMetrics.northstar.trend}</span>
              </span>
              <span className="text-neutral-400 font-mono text-[10px]">
                {cardMetrics.northstar.targetNote}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Guardrail 1 card (Prospects Qualified) */}
        <div 
          className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-neutral-300 transition-all group"
          id="qual-v2-guardrail-1-card"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold text-neutral-800">
                {cardMetrics.guardrail1.primaryLabel}
              </h3>
              <ShieldCheck size={15} className="text-emerald-600" />
            </div>

            {/* Primary Metric (Headline Figure) */}
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tracking-tight text-neutral-900">
                  {cardMetrics.guardrail1.primaryVal}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Metric (High Confidence qualification volume) */}
          <div className="mt-4 pt-3 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 font-medium text-[11px]">
                {cardMetrics.guardrail1.secondaryLabel}
              </span>
              <span className="font-bold text-neutral-900 text-xs">
                {cardMetrics.guardrail1.secondaryVal}
              </span>
            </div>
            {/* Footer row: % of uploaded rows processed */}
            <div className="mt-1.5 flex items-center justify-between text-[10.5px]">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                <CheckCircle2 size={12} />
                <span>{cardMetrics.guardrail1.footerText}</span>
              </span>
              <span className="text-neutral-400 font-mono text-[10px]">
                {cardMetrics.guardrail1.targetNote}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Guardrail 2 card (Campaign Performance) */}
        <div 
          className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-neutral-300 transition-all group"
          id="qual-v2-guardrail-2-card"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold text-neutral-800">
                {cardMetrics.guardrail2.primaryLabel}
              </h3>
              <BarChart3 size={15} className="text-neutral-600" />
            </div>

            {/* Primary Metric (Headline Figure: 4.1 / 5) */}
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tracking-tight text-neutral-900">
                  {cardMetrics.guardrail2.primaryVal}
                </span>
                <span className="text-xs text-neutral-500 font-semibold">
                  avg score
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Metric (Unqualifiable rate) */}
          <div className="mt-4 pt-3 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 font-medium text-[11px]">
                {cardMetrics.guardrail2.secondaryLabel}
              </span>
              <span className="font-bold text-neutral-900 text-xs">
                {cardMetrics.guardrail2.secondaryVal}
              </span>
            </div>
            {/* Footer row: One full-width warning line */}
            <div className="mt-1.5 flex items-center justify-between text-[10.5px]">
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700 w-full">
                <AlertTriangle size={12} className="shrink-0 text-amber-600" />
                <span>{cardMetrics.guardrail2.warningText}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Daily Burn Rate & Budget Consumed */}
        <div 
          className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-neutral-300 transition-all group"
          id="qual-v2-burn-budget-card"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold text-neutral-800">
                {cardMetrics.burnAndBudget.primaryLabel}
              </h3>
              <Flame size={15} className="text-amber-600" />
            </div>

            {/* Primary Metric (Headline Figure: Daily Burn Rate) */}
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tracking-tight text-neutral-900">
                  {cardMetrics.burnAndBudget.primaryVal}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Metric (Budget consumed till date) */}
          <div className="mt-4 pt-3 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 font-medium text-[11px]">
                {cardMetrics.burnAndBudget.secondaryLabel}
              </span>
              <span className="font-bold text-neutral-900 text-xs">
                {cardMetrics.burnAndBudget.secondaryVal}
              </span>
            </div>
            {/* Footer row: Pace status on left, Target pace on right */}
            <div className="mt-1.5 flex items-center justify-between text-[10.5px]">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                <CheckCircle2 size={12} />
                <span>{cardMetrics.burnAndBudget.paceStatus}</span>
              </span>
              <span className="text-neutral-400 font-mono text-[10px]">
                {cardMetrics.burnAndBudget.targetNote}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* SLICES CONTROL BAR: TAB CONTROL & SEARCH / FILTERS */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs space-y-4" id="qual-v2-slices-section">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-100 pb-3">
          {/* Slices Tab Bar */}
          <div className="flex items-center gap-1.5 bg-neutral-100/90 p-1 rounded-xl border border-neutral-200/80 overflow-x-auto select-none" id="qual-v2-slices-tab-bar">
            {sliceTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSlice === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveSlice(tab.key);
                    setCqcFilter('all');
                    setSearchQuery('');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/80'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                  }`}
                  id={`qual-slice-tab-${tab.key}`}
                >
                  <Icon size={14} className={isActive ? 'text-[#2563eb]' : 'text-neutral-500'} />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                    isActive ? 'bg-neutral-100 text-neutral-800' : 'bg-neutral-200/60 text-neutral-600'
                  }`}>
                    {rawSliceData[tab.key].length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Filters & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Target vs Outside Target Filter (Segmented Control) */}
            <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-lg p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setCqcFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  cqcFilter === 'all' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                All Rows ({rawSliceData[activeSlice].length})
              </button>
              <button
                type="button"
                onClick={() => setCqcFilter('within')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  cqcFilter === 'within' ? 'bg-emerald-50 text-emerald-800 shadow-2xs font-bold' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Within Target
              </button>
              <button
                type="button"
                onClick={() => setCqcFilter('outside')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  cqcFilter === 'outside' ? 'bg-rose-50 text-rose-800 shadow-2xs font-bold' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Outside Target
              </button>
            </div>

            {/* Search Input with Dynamic Placeholder */}
            <div className="relative min-w-[200px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#2563eb] text-neutral-800 placeholder:text-neutral-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* SLICES TABLE: Data grid with 7 columns & cell-level conditional color coding */}
        <div className="overflow-x-auto rounded-lg border border-neutral-200" id="qual-v2-slices-table-container">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50/90 text-neutral-600 font-semibold border-b border-neutral-200 text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3.5 min-w-[230px]">
                  {activeSlice === 'campaign' ? 'Campaign' :
                   activeSlice === 'category' ? 'Product Category' :
                   activeSlice === 'geography' ? 'Geography / Market' :
                   'Persona Segment'}
                </th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">
                  Target CQC
                </th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">
                  Actual CQC
                </th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">
                  Prospects Qualified
                </th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">
                  % High Confidence
                </th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">
                  Budget Consumed
                </th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">
                  Budget Left
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/80 bg-white">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-400 font-medium">
                    No entities found matching your search or CQC filter.
                  </td>
                </tr>
              ) : (
                currentItems.map((row) => {
                  const isWithinTarget = row.actualCQC <= row.targetCQC;
                  const variance = row.actualCQC - row.targetCQC;
                  const variancePercent = ((Math.abs(variance) / row.targetCQC) * 100).toFixed(1);

                  return (
                    <tr 
                      key={row.id} 
                      className="hover:bg-neutral-50/80 transition-colors group"
                    >
                      {/* Entity Name & Subtitle / Status */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-bold text-neutral-900 group-hover:text-[#2563eb] transition-colors">
                              {row.name}
                            </div>
                            {row.subtext && (
                              <div className="text-[10.5px] text-neutral-400 font-normal mt-0.5">
                                {row.subtext}
                              </div>
                            )}
                          </div>
                          {row.statusBadge && (
                            <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-semibold ml-1.5 ${
                              row.statusBadge === 'Active' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                            }`}>
                              {row.statusBadge}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Target CQC */}
                      <td className="px-4 py-3.5 text-right font-mono font-medium text-neutral-600">
                        ₹{row.targetCQC.toLocaleString('en-IN')}
                      </td>

                      {/* Actual CQC (Conditional Color Coded) */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex flex-col items-end">
                          <span 
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono transition-all ${
                              isWithinTarget
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90'
                                : 'bg-rose-50 text-rose-800 border border-rose-200/90'
                            }`}
                          >
                            {isWithinTarget ? (
                              <CheckCircle2 size={12} className="text-emerald-600" />
                            ) : (
                              <AlertTriangle size={12} className="text-rose-600" />
                            )}
                            <span>₹{row.actualCQC.toLocaleString('en-IN')}</span>
                          </span>
                          <span className={`text-[10px] font-semibold mt-0.5 ${
                            isWithinTarget ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {isWithinTarget 
                              ? `Within (${variance <= 0 ? '-' : ''}₹${Math.abs(variance)})`
                              : `+₹${variance} (+${variancePercent}%)`}
                          </span>
                        </div>
                      </td>

                      {/* Prospects Qualified */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-neutral-900">
                        {row.prospectsQualified.toLocaleString('en-IN')}
                      </td>

                      {/* % High Confidence with Color-coded Progress Bar */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className="font-mono font-bold text-neutral-900 text-xs">
                            {row.highConfidencePercent.toFixed(1)}%
                          </span>
                          {/* Progress bar: Green (>=60%), Blue (50-59%), Amber (<50%) */}
                          <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden mt-1 border border-neutral-200/60">
                            <div 
                              className={`h-full rounded-full ${
                                row.highConfidencePercent >= 60 ? 'bg-emerald-500' :
                                row.highConfidencePercent >= 50 ? 'bg-[#2563eb]' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, row.highConfidencePercent)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Budget Consumed */}
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-neutral-800">
                        {formatCurrency(row.budgetConsumed)}
                      </td>

                      {/* Budget Left */}
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-neutral-600">
                        {row.budgetLeft === 0 ? (
                          <span className="text-neutral-400 font-normal">Exhausted (₹0)</span>
                        ) : (
                          <span>{formatCurrency(row.budgetLeft)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Pinned Total / Blended Footer Row */}
            {currentItems.length > 0 && (
              <tfoot>
                <tr className="bg-neutral-50/95 font-bold border-t-2 border-neutral-200 text-neutral-900 text-[11.5px]">
                  <td className="px-4 py-3 text-neutral-800">
                    <div className="flex items-center gap-1.5">
                      <span>Total / Blended ({tableSummary.rowCount} rows)</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-neutral-700">
                    ₹{tableSummary.avgTargetCQC.toLocaleString('en-IN')} <span className="text-[10px] font-normal text-neutral-400">avg</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                      tableSummary.blendedActualCQC <= tableSummary.avgTargetCQC
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      ₹{tableSummary.blendedActualCQC.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-neutral-900">
                    {tableSummary.totalProspects.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-neutral-900">
                    {tableSummary.blendedHighConf.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-neutral-900">
                    {formatCurrency(tableSummary.totalBudgetConsumed)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-neutral-700">
                    {formatCurrency(tableSummary.totalBudgetLeft)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

      </div>

    </div>
  );
};
