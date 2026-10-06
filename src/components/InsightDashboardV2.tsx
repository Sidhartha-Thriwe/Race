import React, { useState, useMemo } from 'react';
import { 
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

export type InsightSliceDimension = 'campaign' | 'category' | 'geography' | 'persona';

export interface InsightSliceRowItem {
  id: string;
  name: string;
  subtext?: string;
  targetCIC: number;
  actualCIC: number;
  customersProfiled: number;
  highConfidencePercent: number;
  budgetConsumed: number;
  budgetLeft: number;
  statusBadge?: string;
}

interface InsightDashboardV2Props {
  selectedPeriod: DashboardPeriod;
  onNewCampaign?: () => void;
  onNavigateToManagement?: (filter?: string) => void;
}

export const InsightDashboardV2: React.FC<InsightDashboardV2Props> = ({
  selectedPeriod,
  onNewCampaign,
  onNavigateToManagement
}) => {
  const [activeSlice, setActiveSlice] = useState<InsightSliceDimension>('campaign');
  const [searchQuery, setSearchQuery] = useState('');
  const [cicFilter, setCicFilter] = useState<'all' | 'within' | 'outside'>('all');

  // Multiplier based on period for realistic figures
  const periodMultiplier = useMemo(() => {
    switch (selectedPeriod) {
      case 'Last week':
        return 0.90;
      case 'This month':
        return 4.1;
      case 'Year to date':
        return 21.5;
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
    // Base figures for "This week" as specified in prompt
    const baseCustomersProfiled = 48200;
    const baseHighConfVolume = 28100;
    const targetCIC = 20;
    let actualCIC = 18;
    let highConfCost = 31;
    const campaignScore = '4.3 / 5';
    const lowDataQualityRate = 8.4;
    const uploadedRowsProcessed = 91;
    const flaggedCampaignsCount = 2;

    if (selectedPeriod === 'Last week') {
      actualCIC = 19;
      highConfCost = 33;
    } else if (selectedPeriod === 'This month') {
      actualCIC = 17.5;
      highConfCost = 30;
    } else if (selectedPeriod === 'Year to date') {
      actualCIC = 17;
      highConfCost = 29;
    }

    const totalCustomers = Math.round(baseCustomersProfiled * periodMultiplier);
    const highConfVolume = Math.round(baseHighConfVolume * periodMultiplier);

    // Budget consumed till date & daily burn rate
    // Base: ₹6.3L till date, ₹0.9L/day
    const baseBudgetConsumedTillDate = 630000;
    const totalBudgetConsumed = Math.round(baseBudgetConsumedTillDate * (selectedPeriod === 'This week' ? 1.0 : periodMultiplier * 0.96));
    const dailyBurnRate = selectedPeriod === 'This week' 
      ? 90000 
      : Math.round(totalBudgetConsumed / (selectedPeriod === 'This month' ? 30 : selectedPeriod === 'Year to date' ? 180 : 7));

    return {
      northstar: {
        primaryLabel: 'Customer Insight Cost',
        primarySub: 'Cost of profiling a single customer',
        primaryVal: `₹${actualCIC}`,
        primaryUnit: '/ customer',
        secondaryLabel: 'Cost per High Confidence insight',
        secondaryVal: `₹${highConfCost}`,
        secondaryUnit: 'per High Conf. insight',
        targetNote: `Target: ₹${targetCIC}`,
        isFavorable: actualCIC <= targetCIC,
        trend: '-10% vs target'
      },
      guardrail1: {
        primaryLabel: 'Customers Profiled',
        primarySub: 'Total customers from uploaded files who received a persona and Top 3 categories',
        primaryVal: `${formatNumber(totalCustomers)} total`,
        primaryUnit: 'profiled & mapped',
        secondaryLabel: 'High Confidence insight volume',
        secondaryVal: formatNumber(highConfVolume),
        secondaryUnit: `${((highConfVolume / totalCustomers) * 100).toFixed(1)}% of total`,
        targetNote: 'Cap: Upload file',
        footerText: `${uploadedRowsProcessed}% of uploaded rows processed`,
        isFavorable: true
      },
      guardrail2: {
        primaryLabel: 'Campaign Performance',
        primarySub: 'Average campaign score across active profiling batches',
        primaryVal: campaignScore,
        primaryUnit: 'Avg campaign score',
        secondaryLabel: 'Low data-quality rate',
        secondaryVal: `${lowDataQualityRate}%`,
        secondaryUnit: 'insufficient roster data for confident persona',
        warningText: `${flaggedCampaignsCount} campaigns flagged for review`
      },
      burnAndBudget: {
        primaryLabel: 'Daily Burn Rate',
        primarySub: 'Average insight spend per day',
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
  const rawSliceData = useMemo<Record<InsightSliceDimension, InsightSliceRowItem[]>>(() => {
    // Campaign slice (matches ~48,200 total profiled customers and ₹18 blended CIC)
    const campaignItems: InsightSliceRowItem[] = [
      {
        id: 'insight-camp-1',
        name: 'Q3 Premium Debit Portfolio Profiling',
        subtext: 'Cards & Retail · Affluent Investors',
        targetCIC: 20,
        actualCIC: 18,
        customersProfiled: Math.round(14200 * periodMultiplier),
        highConfidencePercent: 64.0,
        budgetConsumed: Math.round(255600 * periodMultiplier),
        budgetLeft: Math.round(144400 * periodMultiplier),
        statusBadge: 'Active'
      },
      {
        id: 'insight-camp-2',
        name: 'Festive Consumer Spend Behavioral Scan',
        subtext: 'Consumer Credit · Corporate Professionals',
        targetCIC: 18,
        actualCIC: 16,
        customersProfiled: Math.round(16800 * periodMultiplier),
        highConfidencePercent: 62.0,
        budgetConsumed: Math.round(268800 * periodMultiplier),
        budgetLeft: Math.round(131200 * periodMultiplier),
        statusBadge: 'Active'
      },
      {
        id: 'insight-camp-3',
        name: 'Micro-Merchant Inflow Segmentation',
        subtext: 'Merchant Solutions · Business Owners',
        targetCIC: 24,
        actualCIC: 28,
        customersProfiled: Math.round(6400 * periodMultiplier),
        highConfidencePercent: 42.0,
        budgetConsumed: Math.round(179200 * periodMultiplier),
        budgetLeft: Math.round(40800 * periodMultiplier),
        statusBadge: 'Active'
      },
      {
        id: 'insight-camp-4',
        name: 'Youth Digital Banking Persona Discovery',
        subtext: 'Digital Banking · Emerging Young Affluent',
        targetCIC: 16,
        actualCIC: 15,
        customersProfiled: Math.round(8200 * periodMultiplier),
        highConfidencePercent: 56.0,
        budgetConsumed: Math.round(123000 * periodMultiplier),
        budgetLeft: Math.round(117000 * periodMultiplier),
        statusBadge: 'Active'
      },
      {
        id: 'insight-camp-5',
        name: 'NRI Remittance & Deposit Intent Profiler',
        subtext: 'Wealth Management · Global NRIs',
        targetCIC: 26,
        actualCIC: 23,
        customersProfiled: Math.round(1600 * periodMultiplier),
        highConfidencePercent: 68.0,
        budgetConsumed: Math.round(36800 * periodMultiplier),
        budgetLeft: Math.round(163200 * periodMultiplier),
        statusBadge: 'Active'
      },
      {
        id: 'insight-camp-6',
        name: 'Branch Walk-in Micro-segmentation Pilot',
        subtext: 'Branch Banking · Senior Citizens & Savers',
        targetCIC: 22,
        actualCIC: 25,
        customersProfiled: Math.round(1000 * periodMultiplier),
        highConfidencePercent: 38.0,
        budgetConsumed: Math.round(25000 * periodMultiplier),
        budgetLeft: Math.round(75000 * periodMultiplier),
        statusBadge: 'Paused'
      }
    ];

    // Category slice
    const categoryItems: InsightSliceRowItem[] = [
      {
        id: 'insight-cat-1',
        name: 'Cards & Retail Banking',
        subtext: 'Debit/Credit lifestyle spend & affinity profiling',
        targetCIC: 19,
        actualCIC: 17,
        customersProfiled: Math.round(17500 * periodMultiplier),
        highConfidencePercent: 63.5,
        budgetConsumed: Math.round(297500 * periodMultiplier),
        budgetLeft: Math.round(152500 * periodMultiplier)
      },
      {
        id: 'insight-cat-2',
        name: 'Consumer Credit & Personal Loans',
        subtext: 'Salary & discretionary spending capacity mapping',
        targetCIC: 18,
        actualCIC: 16,
        customersProfiled: Math.round(14800 * periodMultiplier),
        highConfidencePercent: 61.2,
        budgetConsumed: Math.round(236800 * periodMultiplier),
        budgetLeft: Math.round(123200 * periodMultiplier)
      },
      {
        id: 'insight-cat-3',
        name: 'Wealth & Priority Banking',
        subtext: 'HNI capital allocation & investment appetite discovery',
        targetCIC: 25,
        actualCIC: 22,
        customersProfiled: Math.round(5400 * periodMultiplier),
        highConfidencePercent: 67.0,
        budgetConsumed: Math.round(118800 * periodMultiplier),
        budgetLeft: Math.round(181200 * periodMultiplier)
      },
      {
        id: 'insight-cat-4',
        name: 'Merchant & Business Solutions',
        subtext: 'Current account turnover & POS transaction profile',
        targetCIC: 24,
        actualCIC: 28,
        customersProfiled: Math.round(6400 * periodMultiplier),
        highConfidencePercent: 42.0,
        budgetConsumed: Math.round(179200 * periodMultiplier),
        budgetLeft: Math.round(40800 * periodMultiplier)
      },
      {
        id: 'insight-cat-5',
        name: 'Digital & Neo-Banking',
        subtext: 'Gen-Z UPI usage & micro-savings propensity clustering',
        targetCIC: 16,
        actualCIC: 15,
        customersProfiled: Math.round(4100 * periodMultiplier),
        highConfidencePercent: 55.0,
        budgetConsumed: Math.round(61500 * periodMultiplier),
        budgetLeft: Math.round(88500 * periodMultiplier)
      }
    ];

    // Geography slice
    const geographyItems: InsightSliceRowItem[] = [
      {
        id: 'insight-geo-1',
        name: 'Mumbai MMR',
        subtext: 'Financial Hub, Premium Suburbs & Western Line',
        targetCIC: 19,
        actualCIC: 17,
        customersProfiled: Math.round(15200 * periodMultiplier),
        highConfidencePercent: 66.0,
        budgetConsumed: Math.round(258400 * periodMultiplier),
        budgetLeft: Math.round(191600 * periodMultiplier)
      },
      {
        id: 'insight-geo-2',
        name: 'Delhi NCR',
        subtext: 'Gurugram, Noida, South & New Delhi',
        targetCIC: 18,
        actualCIC: 16,
        customersProfiled: Math.round(13400 * periodMultiplier),
        highConfidencePercent: 62.0,
        budgetConsumed: Math.round(214400 * periodMultiplier),
        budgetLeft: Math.round(165600 * periodMultiplier)
      },
      {
        id: 'insight-geo-3',
        name: 'Bengaluru Urban',
        subtext: 'Tech Parks, Koramangala, Indiranagar, Whitefield',
        targetCIC: 18,
        actualCIC: 16,
        customersProfiled: Math.round(9800 * periodMultiplier),
        highConfidencePercent: 64.0,
        budgetConsumed: Math.round(156800 * periodMultiplier),
        budgetLeft: Math.round(123200 * periodMultiplier)
      },
      {
        id: 'insight-geo-4',
        name: 'Hyderabad & Pune Corridor',
        subtext: 'Cyberabad, Hinjewadi, Kharadi Tech Zones',
        targetCIC: 17,
        actualCIC: 16,
        customersProfiled: Math.round(6200 * periodMultiplier),
        highConfidencePercent: 54.0,
        budgetConsumed: Math.round(99200 * periodMultiplier),
        budgetLeft: Math.round(80800 * periodMultiplier)
      },
      {
        id: 'insight-geo-5',
        name: 'Tier 2 Emerging Growth Hubs',
        subtext: 'Ahmedabad, Jaipur, Chandigarh, Kochi, Lucknow',
        targetCIC: 20,
        actualCIC: 23,
        customersProfiled: Math.round(3600 * periodMultiplier),
        highConfidencePercent: 44.0,
        budgetConsumed: Math.round(82800 * periodMultiplier),
        budgetLeft: Math.round(37200 * periodMultiplier)
      }
    ];

    // Persona slice
    const personaItems: InsightSliceRowItem[] = [
      {
        id: 'insight-per-1',
        name: 'Corporate & Tech Professionals',
        subtext: '₹18L-₹45L annual compensation, tech-first lifestyle',
        targetCIC: 18,
        actualCIC: 16,
        customersProfiled: Math.round(16800 * periodMultiplier),
        highConfidencePercent: 62.0,
        budgetConsumed: Math.round(268800 * periodMultiplier),
        budgetLeft: Math.round(131200 * periodMultiplier)
      },
      {
        id: 'insight-per-2',
        name: 'Affluent Investors & HNIs',
        subtext: '₹50L+ liquid investable assets & multi-asset holdings',
        targetCIC: 24,
        actualCIC: 21,
        customersProfiled: Math.round(12400 * periodMultiplier),
        highConfidencePercent: 66.0,
        budgetConsumed: Math.round(260400 * periodMultiplier),
        budgetLeft: Math.round(189600 * periodMultiplier)
      },
      {
        id: 'insight-per-3',
        name: 'Emerging Young Affluent',
        subtext: 'Early career high earners & aspirational spenders',
        targetCIC: 16,
        actualCIC: 15,
        customersProfiled: Math.round(8200 * periodMultiplier),
        highConfidencePercent: 56.0,
        budgetConsumed: Math.round(123000 * periodMultiplier),
        budgetLeft: Math.round(117000 * periodMultiplier)
      },
      {
        id: 'insight-per-4',
        name: 'SME Business Owners & Traders',
        subtext: 'Proprietors with ₹2Cr-₹15Cr annual business turnover',
        targetCIC: 24,
        actualCIC: 28,
        customersProfiled: Math.round(6400 * periodMultiplier),
        highConfidencePercent: 42.0,
        budgetConsumed: Math.round(179200 * periodMultiplier),
        budgetLeft: Math.round(40800 * periodMultiplier)
      },
      {
        id: 'insight-per-5',
        name: 'Global NRIs & Cross-Border Earners',
        subtext: 'High remittance inflow & overseas currency holdings',
        targetCIC: 26,
        actualCIC: 23,
        customersProfiled: Math.round(2800 * periodMultiplier),
        highConfidencePercent: 67.0,
        budgetConsumed: Math.round(64400 * periodMultiplier),
        budgetLeft: Math.round(135600 * periodMultiplier)
      },
      {
        id: 'insight-per-6',
        name: 'Conservative High-Balance Savers',
        subtext: 'Senior citizens & fixed-income capital preservers',
        targetCIC: 20,
        actualCIC: 23,
        customersProfiled: Math.round(1600 * periodMultiplier),
        highConfidencePercent: 40.0,
        budgetConsumed: Math.round(36800 * periodMultiplier),
        budgetLeft: Math.round(63200 * periodMultiplier)
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

  // Active items filtered by search and CIC within/outside target
  const currentItems = useMemo(() => {
    let items = rawSliceData[activeSlice];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        i => i.name.toLowerCase().includes(q) || (i.subtext && i.subtext.toLowerCase().includes(q))
      );
    }

    if (cicFilter === 'within') {
      items = items.filter(i => i.actualCIC <= i.targetCIC);
    } else if (cicFilter === 'outside') {
      items = items.filter(i => i.actualCIC > i.targetCIC);
    }

    return items;
  }, [rawSliceData, activeSlice, searchQuery, cicFilter]);

  // Aggregate stats for the current slice table (recalculates on filtered items)
  const tableSummary = useMemo(() => {
    const items = currentItems;
    const totalCustomers = items.reduce((acc, curr) => acc + curr.customersProfiled, 0);
    const totalBudgetConsumed = items.reduce((acc, curr) => acc + curr.budgetConsumed, 0);
    const totalBudgetLeft = items.reduce((acc, curr) => acc + curr.budgetLeft, 0);
    
    // Blended actual CIC: total budget consumed / total customers profiled
    const blendedActualCIC = totalCustomers > 0 ? Math.round(totalBudgetConsumed / totalCustomers) : 0;
    
    // Average target CIC
    const avgTargetCIC = items.length > 0 
      ? Math.round(items.reduce((acc, curr) => acc + curr.targetCIC, 0) / items.length) 
      : 0;
    
    // Blended % high confidence
    const blendedHighConf = totalCustomers > 0
      ? (items.reduce((acc, curr) => acc + (curr.highConfidencePercent * curr.customersProfiled), 0) / totalCustomers)
      : 0;

    return {
      totalCustomers,
      totalBudgetConsumed,
      totalBudgetLeft,
      blendedActualCIC,
      avgTargetCIC,
      blendedHighConf,
      rowCount: items.length
    };
  }, [currentItems]);

  const sliceTabs: { key: InsightSliceDimension; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { key: 'campaign', label: 'By Campaign', icon: FolderKanban },
    { key: 'category', label: 'By Product Category', icon: Layers },
    { key: 'geography', label: 'By Geography', icon: MapPin },
    { key: 'persona', label: 'By Persona', icon: UserCheck }
  ];

  return (
    <div className="space-y-6 pb-16 font-sans select-none" id="insight-dashboard-v2-container">
      
      {/* TOP ROW: 4 STAT TILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="insight-v2-stat-cards-grid">
        
        {/* Card 1: Northstar card (Customer Insight Cost) */}
        <div 
          className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-neutral-300 transition-all group"
          id="insight-v2-northstar-card"
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

          {/* Secondary Metric (Cost per High Confidence insight) */}
          <div className="mt-4 pt-3 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 font-medium text-[11px]">
                {cardMetrics.northstar.secondaryLabel}
              </span>
              <span className="font-bold text-neutral-900 text-xs">
                {cardMetrics.northstar.secondaryVal}
              </span>
            </div>
            {/* Footer row: % vs target on left, Target: ₹20 on right */}
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

        {/* Card 2: Guardrail 1 card (Customers Profiled) */}
        <div 
          className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-neutral-300 transition-all group"
          id="insight-v2-guardrail-1-card"
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

          {/* Secondary Metric (High Confidence insight volume) */}
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
          id="insight-v2-guardrail-2-card"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold text-neutral-800">
                {cardMetrics.guardrail2.primaryLabel}
              </h3>
              <BarChart3 size={15} className="text-neutral-600" />
            </div>

            {/* Primary Metric (Headline Figure: 4.3 / 5) */}
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

          {/* Secondary Metric (Low data-quality rate) */}
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
          id="insight-v2-burn-budget-card"
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
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs space-y-4" id="insight-v2-slices-section">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-100 pb-3">
          {/* Slices Tab Bar */}
          <div className="flex items-center gap-1.5 bg-neutral-100/90 p-1 rounded-xl border border-neutral-200/80 overflow-x-auto select-none" id="insight-v2-slices-tab-bar">
            {sliceTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSlice === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveSlice(tab.key);
                    setCicFilter('all');
                    setSearchQuery('');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/80'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                  }`}
                  id={`insight-slice-tab-${tab.key}`}
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
                onClick={() => setCicFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  cicFilter === 'all' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                All Rows ({rawSliceData[activeSlice].length})
              </button>
              <button
                type="button"
                onClick={() => setCicFilter('within')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  cicFilter === 'within' ? 'bg-emerald-50 text-emerald-800 shadow-2xs font-bold' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Within Target
              </button>
              <button
                type="button"
                onClick={() => setCicFilter('outside')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  cicFilter === 'outside' ? 'bg-rose-50 text-rose-800 shadow-2xs font-bold' : 'text-neutral-500 hover:text-neutral-900'
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
        <div className="overflow-x-auto rounded-lg border border-neutral-200" id="insight-v2-slices-table-container">
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
                  Target CIC
                </th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">
                  Actual CIC
                </th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">
                  Customers Profiled
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
                    No entities found matching your search or CIC filter.
                  </td>
                </tr>
              ) : (
                currentItems.map((row) => {
                  const isWithinTarget = row.actualCIC <= row.targetCIC;
                  const variance = row.actualCIC - row.targetCIC;
                  const variancePercent = ((Math.abs(variance) / row.targetCIC) * 100).toFixed(1);

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

                      {/* Target CIC */}
                      <td className="px-4 py-3.5 text-right font-mono font-medium text-neutral-600">
                        ₹{row.targetCIC.toLocaleString('en-IN')}
                      </td>

                      {/* Actual CIC (Conditional Color Coded) */}
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
                            <span>₹{row.actualCIC.toLocaleString('en-IN')}</span>
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

                      {/* Customers Profiled */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-neutral-900">
                        {row.customersProfiled.toLocaleString('en-IN')}
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
                    ₹{tableSummary.avgTargetCIC.toLocaleString('en-IN')} <span className="text-[10px] font-normal text-neutral-400">avg</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                      tableSummary.blendedActualCIC <= tableSummary.avgTargetCIC
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      ₹{tableSummary.blendedActualCIC.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-neutral-900">
                    {tableSummary.totalCustomers.toLocaleString('en-IN')}
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
