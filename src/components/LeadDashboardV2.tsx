import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ShieldCheck, 
  BarChart3, 
  Users, 
  Layers, 
  MapPin, 
  UserCheck, 
  FolderKanban,
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowUpRight, 
  Search, 
  Download,
  Filter,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { DashboardPeriod } from './AdminPanel';
import { Campaign } from './CampaignBuilder';

export type SliceDimension = 'campaign' | 'category' | 'geography' | 'persona';

interface SliceRowItem {
  id: string;
  name: string;
  subtext?: string;
  targetCAC: number;
  actualCAC: number;
  prospectsGenerated: number;
  highConfidencePercent: number;
  budgetConsumed: number;
  budgetLeft: number;
  statusBadge?: string;
}

interface LeadDashboardV2Props {
  selectedPeriod: DashboardPeriod;
  campaigns?: Campaign[];
  onNavigateToManagement?: (filter: 'All' | 'Outside Target' | 'Within Target') => void;
  onNewCampaign?: () => void;
}

export const LeadDashboardV2: React.FC<LeadDashboardV2Props> = ({
  selectedPeriod,
  campaigns = [],
  onNavigateToManagement,
  onNewCampaign
}) => {
  const [activeSlice, setActiveSlice] = useState<SliceDimension>('campaign');
  const [searchQuery, setSearchQuery] = useState('');
  const [cacFilter, setCacFilter] = useState<'all' | 'within' | 'outside'>('all');

  // Multiplier based on period for realistic figures
  const periodMultiplier = useMemo(() => {
    switch (selectedPeriod) {
      case 'Last week':
        return 0.85;
      case 'This month':
        return 3.8;
      case 'Year to date':
        return 18.5;
      case 'This week':
      default:
        return 1.0;
    }
  }, [selectedPeriod]);

  // Format currency in Indian numbering (Lakh / K / Cr or raw)
  const formatCurrency = (val: number): string => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)}Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    if (val >= 1000) {
      return `₹${(val / 1000).toFixed(1)}K`;
    }
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  const formatNumber = (val: number): string => {
    return Math.round(val).toLocaleString('en-IN');
  };

  // 1. Compute Top 4 Cards Across All Campaigns for Current Date Range
  const cardMetrics = useMemo(() => {
    // Base figures for "This week"
    const baseProspects = 1534;
    const baseHighConfVolume = 875;
    const baseActualCAC = 1480;
    const baseHighConfCAC = 2596;
    const totalCampaigns = 6;
    const underTargetCampaigns = 4;
    const highConfProportion = 57.0;
    const zeroMatchRate = 2.1;
    const fulfillmentRate = 94.8;

    const totalProspects = Math.round(baseProspects * periodMultiplier);
    const highConfVolume = Math.round(baseHighConfVolume * periodMultiplier);

    // Minor period variance for CAC
    let actualCAC = baseActualCAC;
    let highConfCAC = baseHighConfCAC;
    if (selectedPeriod === 'Last week') {
      actualCAC = 1498;
      highConfCAC = 2640;
    } else if (selectedPeriod === 'This month') {
      actualCAC = 1445;
      highConfCAC = 2510;
    } else if (selectedPeriod === 'Year to date') {
      actualCAC = 1420;
      highConfCAC = 2480;
    }

    return {
      northstar: {
        primaryLabel: 'Customer Acquisition Cost',
        primarySub: 'Cost of acquiring single prospect',
        primaryVal: `₹${actualCAC.toLocaleString('en-IN')}`,
        primaryUnit: 'per prospect',
        secondaryLabel: 'Cost per High Confidence lead',
        secondaryVal: `₹${highConfCAC.toLocaleString('en-IN')}`,
        secondaryUnit: 'per High Conf. lead',
        targetNote: 'Target CAC ceiling: ₹1,500',
        isFavorable: actualCAC <= 1500,
        trend: selectedPeriod === 'Last week' ? '+1.2% vs baseline' : '-1.3% vs target'
      },
      guardrail1: {
        primaryLabel: 'Count of Prospects Generated',
        primarySub: 'Total prospects generated',
        primaryVal: formatNumber(totalProspects),
        primaryUnit: selectedPeriod === 'This week' ? 'prospects (110/day)' : 'prospects',
        secondaryLabel: 'High Confidence lead volume',
        secondaryVal: formatNumber(highConfVolume),
        secondaryUnit: `${highConfProportion}% of total`,
        targetNote: 'Min daily run-rate: 100/day',
        isFavorable: true,
        trend: '+6.4% vs run-rate'
      },
      guardrail2: {
        primaryLabel: 'Campaign Performance',
        primarySub: 'Campaigns performing under target',
        primaryVal: `${underTargetCampaigns} of ${totalCampaigns}`,
        primaryUnit: 'under target CAC (66.7%)',
        secondaryLabel: 'Campaign Fulfillment rate',
        secondaryVal: `${fulfillmentRate}%`,
        secondaryUnit: 'High Confidence delivery',
        targetNote: 'Min fulfillment threshold: 90%',
        isFavorable: true,
        trend: '2 campaigns flagged for review'
      },
      leadingMetric: {
        primaryLabel: '% High Confidence Leads',
        primarySub: 'Proportion of high confidence lead',
        primaryVal: `${highConfProportion.toFixed(1)}%`,
        primaryUnit: 'of total delivered',
        secondaryLabel: 'Zero match rate',
        secondaryVal: `${zeroMatchRate.toFixed(1)}%`,
        secondaryUnit: 'unqualified dropped',
        targetNote: 'Benchmark target: ≥ 50%',
        isFavorable: highConfProportion >= 50,
        trend: '+2.8% above quality SLA'
      }
    };
  }, [selectedPeriod, periodMultiplier]);

  // 2. Generate Slice Data Sets for Each Dimension
  const rawSliceData = useMemo<Record<SliceDimension, SliceRowItem[]>>(() => {
    // A. By Campaign Slice
    const campaignItems: SliceRowItem[] = [
      {
        id: 'camp-1',
        name: 'Festive Season Push',
        subtext: 'Credit Cards · Tier 1 & Metro',
        targetCAC: 1500,
        actualCAC: Math.round(1420 * (selectedPeriod === 'Last week' ? 1.02 : 1)),
        prospectsGenerated: Math.round(780 * periodMultiplier),
        highConfidencePercent: 68.2,
        budgetConsumed: Math.round(1107600 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 1500000 - 1107600 * periodMultiplier)),
        statusBadge: 'Active'
      },
      {
        id: 'camp-2',
        name: 'HNI Wealth Onboarding',
        subtext: 'Wealth Advisory · HNI & UHNI',
        targetCAC: 3200,
        actualCAC: Math.round(2432 * (selectedPeriod === 'Last week' ? 1.03 : 1)),
        prospectsGenerated: Math.round(148 * periodMultiplier),
        highConfidencePercent: 82.4,
        budgetConsumed: Math.round(359936 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 2200000 - 359936 * periodMultiplier)),
        statusBadge: 'Active'
      },
      {
        id: 'camp-3',
        name: 'Premium Card Upsell',
        subtext: 'Credit Cards · Mass Affluent & HNI',
        targetCAC: 1100,
        actualCAC: 1350, // Outside target!
        prospectsGenerated: Math.round(210 * periodMultiplier),
        highConfidencePercent: 42.8,
        budgetConsumed: Math.round(283500 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 1000000 - 283500 * periodMultiplier)),
        statusBadge: 'Active'
      },
      {
        id: 'camp-4',
        name: 'UHNI Referral Drive',
        subtext: 'Custom Portfolio · Private Yachting & Horology',
        targetCAC: 5500,
        actualCAC: Math.round(4800 * (selectedPeriod === 'Last week' ? 0.98 : 1)),
        prospectsGenerated: Math.round(85 * periodMultiplier),
        highConfidencePercent: 91.8,
        budgetConsumed: Math.round(408000 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 1500000 - 408000 * periodMultiplier)),
        statusBadge: 'Active'
      },
      {
        id: 'camp-5',
        name: 'Corporate Salary Elevate',
        subtext: 'Retail Banking · Corporate Golfers',
        targetCAC: 2100,
        actualCAC: 2000,
        prospectsGenerated: Math.round(90 * periodMultiplier),
        highConfidencePercent: 55.6,
        budgetConsumed: Math.round(180000 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 500000 - 180000 * periodMultiplier)),
        statusBadge: 'Paused'
      },
      {
        id: 'camp-6',
        name: 'NRE Deposits Spark',
        subtext: 'Wealth Advisory · Luxury Automobiles',
        targetCAC: 2900,
        actualCAC: 3150, // Outside target!
        prospectsGenerated: Math.round(221 * periodMultiplier),
        highConfidencePercent: 48.4,
        budgetConsumed: Math.round(696150 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 750000 - 696150 * periodMultiplier)),
        statusBadge: 'Active'
      }
    ];

    // B. By Product Category Slice
    const categoryItems: SliceRowItem[] = [
      {
        id: 'cat-1',
        name: 'Credit Cards & Co-Brand Metal',
        subtext: 'Fintech & Issuing Banks',
        targetCAC: 1400,
        actualCAC: 1320, // Within
        prospectsGenerated: Math.round(520 * periodMultiplier),
        highConfidencePercent: 64.5,
        budgetConsumed: Math.round(686400 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 1200000 - 686400 * periodMultiplier))
      },
      {
        id: 'cat-2',
        name: 'Wealth Advisory & Portfolio Mgmt',
        subtext: 'Asset Management & Family Offices',
        targetCAC: 3200,
        actualCAC: 2780, // Within
        prospectsGenerated: Math.round(290 * periodMultiplier),
        highConfidencePercent: 78.6,
        budgetConsumed: Math.round(806200 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 1600000 - 806200 * periodMultiplier))
      },
      {
        id: 'cat-3',
        name: 'Luxury Automobiles',
        subtext: 'Premium Automotive Brands',
        targetCAC: 2800,
        actualCAC: 3050, // Outside target!
        prospectsGenerated: Math.round(195 * periodMultiplier),
        highConfidencePercent: 51.2,
        budgetConsumed: Math.round(594750 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 900000 - 594750 * periodMultiplier))
      },
      {
        id: 'cat-4',
        name: 'Fine Dining & Lifestyle Memberships',
        subtext: 'Hospitality & Private Clubs',
        targetCAC: 1200,
        actualCAC: 1140, // Within
        prospectsGenerated: Math.round(310 * periodMultiplier),
        highConfidencePercent: 58.0,
        budgetConsumed: Math.round(353400 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 600000 - 353400 * periodMultiplier))
      },
      {
        id: 'cat-5',
        name: 'Private Yachting & High Horology',
        subtext: 'Ultra-Luxury Horology & Marine',
        targetCAC: 5400,
        actualCAC: 4890, // Within
        prospectsGenerated: Math.round(92 * periodMultiplier),
        highConfidencePercent: 89.5,
        budgetConsumed: Math.round(449880 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 1000000 - 449880 * periodMultiplier))
      },
      {
        id: 'cat-6',
        name: 'Wellness & Luxury Spas',
        subtext: 'Holistic Wellness Retreats',
        targetCAC: 1500,
        actualCAC: 1680, // Outside target!
        prospectsGenerated: Math.round(127 * periodMultiplier),
        highConfidencePercent: 44.0,
        budgetConsumed: Math.round(213360 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 450000 - 213360 * periodMultiplier))
      }
    ];

    // C. By Geography Slice
    const geographyItems: SliceRowItem[] = [
      {
        id: 'geo-1',
        name: 'Mumbai MMR',
        subtext: 'South Mumbai, BKC, Western Suburbs',
        targetCAC: 1800,
        actualCAC: 1620, // Within
        prospectsGenerated: Math.round(480 * periodMultiplier),
        highConfidencePercent: 72.4,
        budgetConsumed: Math.round(777600 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 1400000 - 777600 * periodMultiplier))
      },
      {
        id: 'geo-2',
        name: 'Delhi NCR',
        subtext: 'South Delhi, Golf Course Rd, Noida Express',
        targetCAC: 1750,
        actualCAC: 1690, // Within
        prospectsGenerated: Math.round(410 * periodMultiplier),
        highConfidencePercent: 66.8,
        budgetConsumed: Math.round(692900 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 1250000 - 692900 * periodMultiplier))
      },
      {
        id: 'geo-3',
        name: 'Bengaluru',
        subtext: 'Indiranagar, Koramangala, Whitefield',
        targetCAC: 1600,
        actualCAC: 1780, // Outside target!
        prospectsGenerated: Math.round(315 * periodMultiplier),
        highConfidencePercent: 54.2,
        budgetConsumed: Math.round(560700 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 950000 - 560700 * periodMultiplier))
      },
      {
        id: 'geo-4',
        name: 'Pune',
        subtext: 'Koregaon Park, Kalyani Nagar, Baner',
        targetCAC: 1400,
        actualCAC: 1310, // Within
        prospectsGenerated: Math.round(145 * periodMultiplier),
        highConfidencePercent: 58.6,
        budgetConsumed: Math.round(189950 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 450000 - 189950 * periodMultiplier))
      },
      {
        id: 'geo-5',
        name: 'Hyderabad',
        subtext: 'Jubilee Hills, Gachibowli, Banjara Hills',
        targetCAC: 1500,
        actualCAC: 1420, // Within
        prospectsGenerated: Math.round(110 * periodMultiplier),
        highConfidencePercent: 61.0,
        budgetConsumed: Math.round(156200 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 400000 - 156200 * periodMultiplier))
      },
      {
        id: 'geo-6',
        name: 'Kolkata',
        subtext: 'Alipore, Ballygunge, Salt Lake',
        targetCAC: 1650,
        actualCAC: 1890, // Outside target!
        prospectsGenerated: Math.round(74 * periodMultiplier),
        highConfidencePercent: 46.5,
        budgetConsumed: Math.round(139860 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 300000 - 139860 * periodMultiplier))
      }
    ];

    // D. By Persona Slice
    const personaItems: SliceRowItem[] = [
      {
        id: 'per-1',
        name: 'Ultra High Net Worth (UHNI)',
        subtext: 'Net worth > ₹25Cr · Family Offices',
        targetCAC: 5200,
        actualCAC: 4850, // Within
        prospectsGenerated: Math.round(115 * periodMultiplier),
        highConfidencePercent: 91.2,
        budgetConsumed: Math.round(557750 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 1200000 - 557750 * periodMultiplier))
      },
      {
        id: 'per-2',
        name: 'High Net Worth (HNI)',
        subtext: 'Net worth ₹5Cr–₹25Cr · Active Investors',
        targetCAC: 3100,
        actualCAC: 2890, // Within
        prospectsGenerated: Math.round(340 * periodMultiplier),
        highConfidencePercent: 77.4,
        budgetConsumed: Math.round(982600 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 1800000 - 982600 * periodMultiplier))
      },
      {
        id: 'per-3',
        name: 'Mass Affluent',
        subtext: 'Annual Income ₹25L–₹75L · Credit & Lifestyle',
        targetCAC: 1200,
        actualCAC: 1340, // Outside target!
        prospectsGenerated: Math.round(620 * periodMultiplier),
        highConfidencePercent: 45.8,
        budgetConsumed: Math.round(830800 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 1100000 - 830800 * periodMultiplier))
      },
      {
        id: 'per-4',
        name: 'Business Founders & CXOs',
        subtext: 'Founders, Promoters & Corporate CXOs',
        targetCAC: 4000,
        actualCAC: 3720, // Within
        prospectsGenerated: Math.round(180 * periodMultiplier),
        highConfidencePercent: 81.5,
        budgetConsumed: Math.round(669600 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 1300000 - 669600 * periodMultiplier))
      },
      {
        id: 'per-5',
        name: 'Senior Corporate Leadership',
        subtext: 'Directors, Partners & Senior VPs',
        targetCAC: 2800,
        actualCAC: 2550, // Within
        prospectsGenerated: Math.round(210 * periodMultiplier),
        highConfidencePercent: 68.0,
        budgetConsumed: Math.round(535500 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 900000 - 535500 * periodMultiplier))
      },
      {
        id: 'per-6',
        name: 'Emerging Affluent Tech Professionals',
        subtext: 'Tech Leads & Product Execs · ₹15L–₹35L',
        targetCAC: 1400,
        actualCAC: 1580, // Outside target!
        prospectsGenerated: Math.round(69 * periodMultiplier),
        highConfidencePercent: 47.2,
        budgetConsumed: Math.round(109020 * periodMultiplier),
        budgetLeft: Math.round(Math.max(0, 250000 - 109020 * periodMultiplier))
      }
    ];

    return {
      campaign: campaignItems,
      category: categoryItems,
      geography: geographyItems,
      persona: personaItems
    };
  }, [selectedPeriod, periodMultiplier]);

  // Active items filtered by search and CAC filter
  const currentItems = useMemo(() => {
    let items = rawSliceData[activeSlice];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        i => i.name.toLowerCase().includes(q) || (i.subtext && i.subtext.toLowerCase().includes(q))
      );
    }

    if (cacFilter === 'within') {
      items = items.filter(i => i.actualCAC <= i.targetCAC);
    } else if (cacFilter === 'outside') {
      items = items.filter(i => i.actualCAC > i.targetCAC);
    }

    return items;
  }, [rawSliceData, activeSlice, searchQuery, cacFilter]);

  // Aggregate stats for the current slice table
  const tableSummary = useMemo(() => {
    const items = rawSliceData[activeSlice];
    const totalProspects = items.reduce((acc, curr) => acc + curr.prospectsGenerated, 0);
    const totalBudgetConsumed = items.reduce((acc, curr) => acc + curr.budgetConsumed, 0);
    const totalBudgetLeft = items.reduce((acc, curr) => acc + curr.budgetLeft, 0);
    
    // Weighted actual CAC
    const weightedActualCAC = totalProspects > 0 ? Math.round(totalBudgetConsumed / totalProspects) : 0;
    
    // Average target CAC
    const avgTargetCAC = Math.round(items.reduce((acc, curr) => acc + curr.targetCAC, 0) / (items.length || 1));
    
    // Blended % high confidence leads
    const blendedHighConf = items.length > 0 
      ? (items.reduce((acc, curr) => acc + (curr.highConfidencePercent * curr.prospectsGenerated), 0) / (totalProspects || 1))
      : 0;

    const withinTargetCount = items.filter(i => i.actualCAC <= i.targetCAC).length;

    return {
      totalProspects,
      totalBudgetConsumed,
      totalBudgetLeft,
      weightedActualCAC,
      avgTargetCAC,
      blendedHighConf,
      withinTargetCount,
      totalCount: items.length
    };
  }, [rawSliceData, activeSlice]);

  const sliceTabs: { key: SliceDimension; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { key: 'campaign', label: 'By Campaign', icon: FolderKanban },
    { key: 'category', label: 'By Product Category', icon: Layers },
    { key: 'geography', label: 'By Geography', icon: MapPin },
    { key: 'persona', label: 'By Persona', icon: UserCheck }
  ];

  return (
    <div className="space-y-6 pb-16 font-sans select-none" id="lead-dashboard-v2-container">
      
      {/* TOP ROW: 4 STAT TILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="v2-stat-cards-grid">
        
        {/* Card 1: Northstar card */}
        <div 
          className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-neutral-300 transition-all group"
          id="v2-northstar-card"
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
                  / prospect
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Metric (Locked Alternative Figure alongside) */}
          <div className="mt-4 pt-3 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 font-medium text-[11px]">
                {cardMetrics.northstar.secondaryLabel}
              </span>
              <span className="font-bold text-neutral-900 text-xs">
                {cardMetrics.northstar.secondaryVal}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10.5px]">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <TrendingDown size={12} />
                <span>{cardMetrics.northstar.trend}</span>
              </span>
              <span className="text-neutral-400 font-mono text-[10px]">
                Cap: ₹1,500
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Guardrail 1 card */}
        <div 
          className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-neutral-300 transition-all group"
          id="v2-guardrail-1-card"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold text-neutral-800">
                {cardMetrics.guardrail1.primaryLabel}
              </h3>
              <Users size={15} className="text-neutral-600" />
            </div>

            {/* Primary Metric (Headline Figure) */}
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tracking-tight text-neutral-900">
                  {cardMetrics.guardrail1.primaryVal}
                </span>
                <span className="text-xs text-neutral-500 font-semibold">
                  total
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Metric (High Confidence lead volume) */}
          <div className="mt-4 pt-3 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 font-medium text-[11px]">
                {cardMetrics.guardrail1.secondaryLabel}
              </span>
              <span className="font-bold text-neutral-900 text-xs">
                {cardMetrics.guardrail1.secondaryVal}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10.5px]">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <TrendingUp size={12} />
                <span>{cardMetrics.guardrail1.trend}</span>
              </span>
              <span className="text-neutral-400 font-mono text-[10px]">
                ≥ 100/day
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Guardrail 2 card */}
        <div 
          className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-neutral-300 transition-all group"
          id="v2-guardrail-2-card"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold text-neutral-800">
                {cardMetrics.guardrail2.primaryLabel}
              </h3>
              <ShieldCheck size={15} className="text-neutral-600" />
            </div>

            {/* Primary Metric (Headline Figure) */}
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tracking-tight text-neutral-900">
                  {cardMetrics.guardrail2.primaryVal}
                </span>
                <span className="text-xs text-neutral-500 font-semibold">
                  under target
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Metric (Fulfillment rate) */}
          <div className="mt-4 pt-3 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 font-medium text-[11px]">
                {cardMetrics.guardrail2.secondaryLabel}
              </span>
              <span className="font-bold text-neutral-900 text-xs">
                {cardMetrics.guardrail2.secondaryVal}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10.5px]">
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <AlertTriangle size={12} />
                <span>{cardMetrics.guardrail2.trend}</span>
              </span>
              <span className="text-neutral-400 font-mono text-[10px]">
                SLA: 90%
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Leading Metric card */}
        <div 
          className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-neutral-300 transition-all group"
          id="v2-leading-metric-card"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold text-neutral-800">
                {cardMetrics.leadingMetric.primaryLabel}
              </h3>
              <BarChart3 size={15} className="text-emerald-700" />
            </div>

            {/* Primary Metric (Headline Figure) */}
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tracking-tight text-neutral-900">
                  {cardMetrics.leadingMetric.primaryVal}
                </span>
                <span className="text-xs text-neutral-500 font-semibold">
                  high confidence
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Metric (Zero match rate) */}
          <div className="mt-4 pt-3 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 font-medium text-[11px]">
                {cardMetrics.leadingMetric.secondaryLabel}
              </span>
              <span className="font-bold text-neutral-900 text-xs">
                {cardMetrics.leadingMetric.secondaryVal}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10.5px]">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>{cardMetrics.leadingMetric.trend}</span>
              </span>
              <span className="text-neutral-400 font-mono text-[10px]">
                Zero match: &lt; 5%
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* SLICES CONTROL BAR: TAB CONTROL (One active at a time) & SEARCH / FILTERS */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs space-y-4" id="v2-slices-section">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-100 pb-3">
          {/* Slices Tab Bar */}
          <div className="flex items-center gap-1.5 bg-neutral-100/90 p-1 rounded-xl border border-neutral-200/80 overflow-x-auto select-none" id="v2-slices-tab-bar">
            {sliceTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSlice === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveSlice(tab.key);
                    setSearchQuery('');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/80'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                  }`}
                  id={`slice-tab-${tab.key}`}
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
            {/* Target vs Outside Target Filter */}
            <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-lg p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setCacFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  cacFilter === 'all' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                All Rows ({rawSliceData[activeSlice].length})
              </button>
              <button
                type="button"
                onClick={() => setCacFilter('within')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  cacFilter === 'within' ? 'bg-emerald-50 text-emerald-800 shadow-2xs font-bold' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Within Target
              </button>
              <button
                type="button"
                onClick={() => setCacFilter('outside')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  cacFilter === 'outside' ? 'bg-rose-50 text-rose-800 shadow-2xs font-bold' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Outside Target
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder={`Filter ${activeSlice}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#2563eb] text-neutral-800 placeholder:text-neutral-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* SLICES TABLE: Data grid with 6 columns & cell-level conditional color coding */}
        <div className="overflow-x-auto rounded-lg border border-neutral-200" id="v2-slices-table-container">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50/90 text-neutral-600 font-semibold border-b border-neutral-200 text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3.5 min-w-[220px]">
                  {activeSlice === 'campaign' ? 'Campaign' :
                   activeSlice === 'category' ? 'Product Category' :
                   activeSlice === 'geography' ? 'Geography / Market' :
                   'Persona Segment'}
                </th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">
                  Target CAC
                </th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">
                  Actual CAC
                </th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">
                  Total Prospects
                </th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">
                  % High Conf Leads
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
                    No entities found matching your search or CAC filter.
                  </td>
                </tr>
              ) : (
                currentItems.map((row) => {
                  const isWithinTarget = row.actualCAC <= row.targetCAC;
                  const variance = row.actualCAC - row.targetCAC;
                  const variancePercent = ((variance / row.targetCAC) * 100).toFixed(1);

                  return (
                    <tr 
                      key={row.id} 
                      className="hover:bg-neutral-50/80 transition-colors group"
                    >
                      {/* Entity Name & Subtext */}
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

                      {/* Target CAC */}
                      <td className="px-4 py-3.5 text-right font-mono font-medium text-neutral-600">
                        ₹{row.targetCAC.toLocaleString('en-IN')}
                      </td>

                      {/* Actual CAC (Conditional Color Coded) */}
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
                            <span>₹{row.actualCAC.toLocaleString('en-IN')}</span>
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

                      {/* Total Prospects Generated */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-neutral-900">
                        {row.prospectsGenerated.toLocaleString('en-IN')}
                      </td>

                      {/* % High Confidence Leads */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className="font-mono font-bold text-neutral-900 text-xs">
                            {row.highConfidencePercent.toFixed(1)}%
                          </span>
                          {/* Mini visual indicator bar */}
                          <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden mt-1 border border-neutral-200/60">
                            <div 
                              className={`h-full rounded-full ${
                                row.highConfidencePercent >= 70 ? 'bg-emerald-500' :
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

            {/* Aggregated Totals Footer Row */}
            {currentItems.length > 0 && (
              <tfoot>
                <tr className="bg-neutral-50/95 font-bold border-t-2 border-neutral-200 text-neutral-900 text-[11.5px]">
                  <td className="px-4 py-3 text-neutral-800">
                    <div className="flex items-center gap-1.5">
                      <span>Total / Blended ({currentItems.length} rows)</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-neutral-700">
                    ₹{tableSummary.avgTargetCAC.toLocaleString('en-IN')} <span className="text-[10px] font-normal text-neutral-400">avg</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                      tableSummary.weightedActualCAC <= tableSummary.avgTargetCAC
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      ₹{tableSummary.weightedActualCAC.toLocaleString('en-IN')}
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
