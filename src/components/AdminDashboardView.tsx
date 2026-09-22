import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Eye, CheckCircle, HelpCircle, AlertCircle, CheckCircle2, Target, ChevronRight, ArrowUpRight } from 'lucide-react';
import { DashboardPeriod } from './AdminPanel';
import { Campaign } from './CampaignBuilder';

interface AdminDashboardViewProps {
  selectedPeriod: DashboardPeriod;
  campaigns?: Campaign[];
  onNavigateToManagement?: (filter: 'All' | 'Outside Target' | 'Within Target') => void;
  onNewCampaign?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ 
  selectedPeriod, 
  campaigns = [], 
  onNavigateToManagement,
  onNewCampaign 
}) => {
  const [activeBudgetHover, setActiveBudgetHover] = useState<number | null>(null);

  // 1. Dynamic dataset based on selected Period
  const activeData = useMemo(() => {
    switch (selectedPeriod) {
      case 'Last week':
        return {
          kpiMetrics: [
            {
              label: "Total leads received",
              value: "1,184",
              trend: "+4.2% vs previous period",
              trendType: "positive",
            },
            {
              label: "Active campaigns",
              value: "10",
              trend: "+1 vs previous period",
              trendType: "neutral",
            },
            {
              label: "Total spend",
              value: "₹16.4L",
              trend: "+3.8% vs previous period",
              trendType: "positive",
            },
            {
              label: "Avg. cost per lead",
              value: "₹1,498",
              trend: "-1.5% vs previous period",
              trendType: "positive-down",
            },
            {
              label: "Leads actioned this week",
              value: "890",
              trend: "+8.2% vs previous period",
              trendType: "positive",
            }
          ],
          pacingCampaigns: [
            {
              name: "Festive Season Push",
              spent: "₹38.0K",
              cap: "₹50.0K",
              percent: 76,
              colorClass: "bg-[#eab308]",
              bgClass: "bg-[#eab308]/10"
            },
            {
              name: "HNI Wealth Onboarding",
              spent: "₹29.0K",
              cap: "₹60.0K",
              percent: 48,
              colorClass: "bg-[#3b82f6]",
              bgClass: "bg-[#3b82f6]/10"
            },
            {
              name: "Premium Card Upsell",
              spent: "₹26.0K",
              cap: "₹28.0K",
              percent: 92,
              colorClass: "bg-[#ef4444]",
              bgClass: "bg-[#ef4444]/10"
            },
            {
              name: "UHNI Referral Drive",
              spent: "₹8.2K",
              cap: "₹40.0K",
              percent: 20,
              colorClass: "bg-[#2563eb]",
              bgClass: "bg-[#2563eb]/10"
            }
          ],
          rawLeadsData: [
            { day: "Mon", val: 110 },
            { day: "Tue", val: 170 },
            { day: "Wed", val: 200 },
            { day: "Thu", val: 150 },
            { day: "Fri", val: 240 },
            { day: "Sat", val: 190 },
            { day: "Sun", val: 175 }
          ],
          spendDataPoints: [
            { day: "Mon", spend: 25, cap: 35 },
            { day: "Tue", spend: 55, cap: 68 },
            { day: "Wed", spend: 80, cap: 95 },
            { day: "Thu", spend: 110, cap: 120 },
            { day: "Fri", spend: 135, cap: 145 },
            { day: "Sat", spend: 160, cap: 170 },
            { day: "Sun", spend: 185, cap: 195 }
          ],
          categories: [
            { name: "Credit Cards", percent: 36, colorClass: "bg-[#3b82f6]" },
            { name: "Wealth Advisory", percent: 26, colorClass: "bg-[#1d4ed8]" },
            { name: "Insurance", percent: 21, colorClass: "bg-[#60a5fa]" },
            { name: "Loans & Mortgages", percent: 17, colorClass: "bg-[#93c5fd]" }
          ],
          confidenceTiers: [
            { name: "High confidence", percent: 45, colorClass: "bg-[#1e3a8a]" },
            { name: "Medium confidence", percent: 39, colorClass: "bg-[#3b82f6]" },
            { name: "Low confidence", percent: 16, colorClass: "bg-[#93c5fd]" }
          ],
          geography: [
            { city: "Mumbai", percent: 30 },
            { city: "Delhi NCR", percent: 22 },
            { city: "Bengaluru", percent: 16 },
            { city: "Pune", percent: 11 },
            { city: "Hyderabad", percent: 8 },
            { city: "Chennai", percent: 6 },
            { city: "Kolkata", percent: 4 },
            { city: "Ahmedabad", percent: 3 }
          ],
          campaignsTable: [
            { name: "Festive Season Push", leads: 285, spend: "₹6.1L", cpl: "₹2,140", trend: "+10%", isPositive: true },
            { name: "HNI Wealth Onboarding", leads: 220, spend: "₹8.4L", cpl: "₹3,818", trend: "+4%", isPositive: true },
            { name: "Premium Card Upsell", leads: 185, spend: "₹2.8L", cpl: "₹1,513", trend: "-2%", isPositive: false },
            { name: "UHNI Referral Drive", leads: 140, spend: "₹4.6L", cpl: "₹3,285", trend: "+15%", isPositive: true },
            { name: "Mass Affluent Starter", leads: 125, spend: "₹1.6L", cpl: "₹1,280", trend: "-5%", isPositive: false }
          ],
          forecastData: [
            { label: "W1", forecast: 75, actual: 70 },
            { label: "W2", forecast: 80, actual: 78 },
            { label: "W3", forecast: 85, actual: 82 },
            { label: "W4", forecast: 90, actual: 86 },
            { label: "W5", forecast: 95, actual: 90 },
            { label: "W6", forecast: 100, actual: 95 }
          ],
          forecastPercent: "Actual tracking 3.7% below forecast",
          donutTotal: "1,184",
          donutSlices: { massAffluent: 44, hni: 38, uhni: 18 }
        };

      case 'This month':
        return {
          kpiMetrics: [
            {
              label: "Total leads received",
              value: "5,420",
              trend: "+12.4% vs previous period",
              trendType: "positive",
            },
            {
              label: "Active campaigns",
              value: "15",
              trend: "+3 vs previous period",
              trendType: "neutral",
            },
            {
              label: "Total spend",
              value: "₹78.2L",
              trend: "+8.7% vs previous period",
              trendType: "positive",
            },
            {
              label: "Avg. cost per lead",
              value: "₹1,385",
              trend: "-5.4% vs previous period",
              trendType: "positive-down",
            },
            {
              label: "Leads actioned this month",
              value: "4,120",
              trend: "+14.8% vs previous period",
              trendType: "positive",
            }
          ],
          pacingCampaigns: [
            {
              name: "Festive Season Push",
              spent: "₹180.0K",
              cap: "₹200.0K",
              percent: 90,
              colorClass: "bg-[#eab308]",
              bgClass: "bg-[#eab308]/10"
            },
            {
              name: "HNI Wealth Onboarding",
              spent: "₹145.0K",
              cap: "₹240.0K",
              percent: 60,
              colorClass: "bg-[#3b82f6]",
              bgClass: "bg-[#3b82f6]/10"
            },
            {
              name: "Premium Card Upsell",
              spent: "₹110.0K",
              cap: "₹112.0K",
              percent: 98,
              colorClass: "bg-[#ef4444]",
              bgClass: "bg-[#ef4444]/10"
            },
            {
              name: "UHNI Referral Drive",
              spent: "₹52.0K",
              cap: "₹160.0K",
              percent: 32,
              colorClass: "bg-[#2563eb]",
              bgClass: "bg-[#2563eb]/10"
            }
          ],
          rawLeadsData: [
            { day: "W1", val: 1200 },
            { day: "W2", val: 1350 },
            { day: "W3", val: 1420 },
            { day: "W4", val: 1450 }
          ],
          spendDataPoints: [
            { day: "W1", spend: 18, cap: 20 },
            { day: "W2", spend: 38, cap: 42 },
            { day: "W3", spend: 58, cap: 60 },
            { day: "W4", spend: 78, cap: 78 }
          ],
          categories: [
            { name: "Credit Cards", percent: 35, colorClass: "bg-[#3b82f6]" },
            { name: "Wealth Advisory", percent: 30, colorClass: "bg-[#1d4ed8]" },
            { name: "Insurance", percent: 20, colorClass: "bg-[#60a5fa]" },
            { name: "Loans & Mortgages", percent: 15, colorClass: "bg-[#93c5fd]" }
          ],
          confidenceTiers: [
            { name: "High confidence", percent: 50, colorClass: "bg-[#1e3a8a]" },
            { name: "Medium confidence", percent: 36, colorClass: "bg-[#3b82f6]" },
            { name: "Low confidence", percent: 14, colorClass: "bg-[#93c5fd]" }
          ],
          geography: [
            { city: "Mumbai", percent: 26 },
            { city: "Delhi NCR", percent: 23 },
            { city: "Bengaluru", percent: 19 },
            { city: "Pune", percent: 13 },
            { city: "Hyderabad", percent: 10 },
            { city: "Chennai", percent: 5 },
            { city: "Kolkata", percent: 3 },
            { city: "Ahmedabad", percent: 1 }
          ],
          campaignsTable: [
            { name: "Festive Season Push", leads: 1312, spend: "₹28.4L", cpl: "₹2,164", trend: "+15%", isPositive: true },
            { name: "HNI Wealth Onboarding", leads: 1120, spend: "₹42.5L", cpl: "₹3,794", trend: "+8%", isPositive: true },
            { name: "Premium Card Upsell", leads: 990, spend: "₹15.2L", cpl: "₹1,535", trend: "-4%", isPositive: false },
            { name: "UHNI Referral Drive", leads: 820, spend: "₹26.8L", cpl: "₹3,268", trend: "+20%", isPositive: true },
            { name: "Mass Affluent Starter", leads: 710, spend: "₹9.1L", cpl: "₹1,281", trend: "-6%", isPositive: false }
          ],
          forecastData: [
            { label: "W1", forecast: 95, actual: 93 },
            { label: "W2", forecast: 100, actual: 97 },
            { label: "W3", forecast: 105, actual: 102 },
            { label: "W4", forecast: 110, actual: 106 },
            { label: "W5", forecast: 115, actual: 110 },
            { label: "W6", forecast: 120, actual: 116 }
          ],
          forecastPercent: "Actual tracking 3.1% below forecast",
          donutTotal: "5,420",
          donutSlices: { massAffluent: 48, hni: 36, uhni: 16 }
        };

      case 'Year to date':
        return {
          kpiMetrics: [
            {
              label: "Total leads received",
              value: "48,950",
              trend: "+22.1% vs previous period",
              trendType: "positive",
            },
            {
              label: "Active campaigns",
              value: "42",
              trend: "+8 vs previous period",
              trendType: "neutral",
            },
            {
              label: "Total spend",
              value: "₹6.8Cr",
              trend: "+15.4% vs previous period",
              trendType: "positive",
            },
            {
              label: "Avg. cost per lead",
              value: "₹1,290",
              trend: "-9.8% vs previous period",
              trendType: "positive-down",
            },
            {
              label: "Leads actioned YTD",
              value: "38,400",
              trend: "+25.3% vs previous period",
              trendType: "positive",
            }
          ],
          pacingCampaigns: [
            {
              name: "Festive Season Push",
              spent: "₹1.62Cr",
              cap: "₹1.80Cr",
              percent: 90,
              colorClass: "bg-[#eab308]",
              bgClass: "bg-[#eab308]/10"
            },
            {
              name: "HNI Wealth Onboarding",
              spent: "₹1.24Cr",
              cap: "₹2.20Cr",
              percent: 56,
              colorClass: "bg-[#3b82f6]",
              bgClass: "bg-[#3b82f6]/10"
            },
            {
              name: "Premium Card Upsell",
              spent: "₹98.0L",
              cap: "₹1.00Cr",
              percent: 98,
              colorClass: "bg-[#ef4444]",
              bgClass: "bg-[#ef4444]/10"
            },
            {
              name: "UHNI Referral Drive",
              spent: "₹45.0L",
              cap: "₹1.50Cr",
              percent: 30,
              colorClass: "bg-[#2563eb]",
              bgClass: "bg-[#2563eb]/10"
            }
          ],
          rawLeadsData: [
            { day: "Q1", val: 11200 },
            { day: "Q2", val: 13100 },
            { day: "Q3", val: 14800 },
            { day: "Q4", val: 15850 }
          ],
          spendDataPoints: [
            { day: "Q1", spend: 1.5, cap: 1.8 },
            { day: "Q2", spend: 3.8, cap: 4.2 },
            { day: "Q3", spend: 5.8, cap: 5.9 },
            { day: "Q4", spend: 6.8, cap: 6.8 }
          ],
          categories: [
            { name: "Credit Cards", percent: 38, colorClass: "bg-[#3b82f6]" },
            { name: "Wealth Advisory", percent: 31, colorClass: "bg-[#1d4ed8]" },
            { name: "Insurance", percent: 18, colorClass: "bg-[#60a5fa]" },
            { name: "Loans & Mortgages", percent: 13, colorClass: "bg-[#93c5fd]" }
          ],
          confidenceTiers: [
            { name: "High confidence", percent: 52, colorClass: "bg-[#1e3a8a]" },
            { name: "Medium confidence", percent: 35, colorClass: "bg-[#3b82f6]" },
            { name: "Low confidence", percent: 13, colorClass: "bg-[#93c5fd]" }
          ],
          geography: [
            { city: "Mumbai", percent: 29 },
            { city: "Delhi NCR", percent: 25 },
            { city: "Bengaluru", percent: 17 },
            { city: "Pune", percent: 12 },
            { city: "Hyderabad", percent: 9 },
            { city: "Chennai", percent: 4 },
            { city: "Kolkata", percent: 2 },
            { city: "Ahmedabad", percent: 2 }
          ],
          campaignsTable: [
            { name: "Festive Season Push", leads: 11450, spend: "₹2.48Cr", cpl: "₹2,165", trend: "+18%", isPositive: true },
            { name: "HNI Wealth Onboarding", leads: 9120, spend: "₹3.46Cr", cpl: "₹3,793", trend: "+11%", isPositive: true },
            { name: "Premium Card Upsell", leads: 8200, spend: "₹1.26Cr", cpl: "₹1,536", trend: "-5%", isPositive: false },
            { name: "UHNI Referral Drive", leads: 6480, spend: "₹2.12Cr", cpl: "₹3,271", trend: "+25%", isPositive: true },
            { name: "Mass Affluent Starter", leads: 5200, spend: "₹66.0L", cpl: "₹1,269", trend: "-8%", isPositive: false }
          ],
          forecastData: [
            { label: "Q1", forecast: 110, actual: 108 },
            { label: "Q2", forecast: 115, actual: 113 },
            { label: "Q3", forecast: 120, actual: 118 },
            { label: "Q4", forecast: 125, actual: 124 }
          ],
          forecastPercent: "Actual tracking 1.2% below forecast",
          donutTotal: "48,950",
          donutSlices: { massAffluent: 50, hni: 35, uhni: 15 }
        };

      case 'This week':
      default:
        return {
          kpiMetrics: [
            {
              label: "Total leads received",
              value: "1,284",
              trend: "+8.4% vs previous period",
              trendType: "positive",
            },
            {
              label: "Active campaigns",
              value: "12",
              trend: "+2 vs previous period",
              trendType: "neutral",
            },
            {
              label: "Total spend",
              value: "₹18.6L",
              trend: "+5.1% vs previous period",
              trendType: "positive",
            },
            {
              label: "Avg. cost per lead",
              value: "₹1,449",
              trend: "-3.2% vs previous period",
              trendType: "positive-down",
            },
            {
              label: "Leads actioned this week",
              value: "962",
              trend: "+11.6% vs previous period",
              trendType: "positive",
            }
          ],
          pacingCampaigns: [
            {
              name: "Festive Season Push",
              spent: "₹42.0K",
              cap: "₹50.0K",
              percent: 84,
              colorClass: "bg-[#eab308]",
              bgClass: "bg-[#eab308]/10"
            },
            {
              name: "HNI Wealth Onboarding",
              spent: "₹31.0K",
              cap: "₹60.0K",
              percent: 52,
              colorClass: "bg-[#3b82f6]",
              bgClass: "bg-[#3b82f6]/10"
            },
            {
              name: "Premium Card Upsell",
              spent: "₹27.5K",
              cap: "₹28.0K",
              percent: 98,
              colorClass: "bg-[#ef4444]",
              bgClass: "bg-[#ef4444]/10"
            },
            {
              name: "UHNI Referral Drive",
              spent: "₹9.0K",
              cap: "₹40.0K",
              percent: 23,
              colorClass: "bg-[#2563eb]",
              bgClass: "bg-[#2563eb]/10"
            }
          ],
          rawLeadsData: [
            { day: "Mon", val: 120 },
            { day: "Tue", val: 190 },
            { day: "Wed", val: 220 },
            { day: "Thu", val: 170 },
            { day: "Fri", val: 270 },
            { day: "Sat", val: 210 },
            { day: "Sun", val: 190 }
          ],
          spendDataPoints: [
            { day: "Mon", spend: 30, cap: 35 },
            { day: "Tue", spend: 65, cap: 68 },
            { day: "Wed", spend: 90, cap: 95 },
            { day: "Thu", spend: 125, cap: 120 },
            { day: "Fri", spend: 155, cap: 145 },
            { day: "Sat", spend: 180, cap: 170 },
            { day: "Sun", spend: 215, cap: 195 }
          ],
          categories: [
            { name: "Credit Cards", percent: 34, colorClass: "bg-[#3b82f6]" },
            { name: "Wealth Advisory", percent: 28, colorClass: "bg-[#1d4ed8]" },
            { name: "Insurance", percent: 22, colorClass: "bg-[#60a5fa]" },
            { name: "Loans & Mortgages", percent: 16, colorClass: "bg-[#93c5fd]" }
          ],
          confidenceTiers: [
            { name: "High confidence", percent: 48, colorClass: "bg-[#1e3a8a]" },
            { name: "Medium confidence", percent: 37, colorClass: "bg-[#3b82f6]" },
            { name: "Low confidence", percent: 15, colorClass: "bg-[#93c5fd]" }
          ],
          geography: [
            { city: "Mumbai", percent: 28 },
            { city: "Delhi NCR", percent: 24 },
            { city: "Bengaluru", percent: 18 },
            { city: "Pune", percent: 12 },
            { city: "Hyderabad", percent: 9 },
            { city: "Chennai", percent: 5 },
            { city: "Kolkata", percent: 3 },
            { city: "Ahmedabad", percent: 1 }
          ],
          campaignsTable: [
            { name: "Festive Season Push", leads: 312, spend: "₹6.8L", cpl: "₹2,179", trend: "+12%", isPositive: true },
            { name: "HNI Wealth Onboarding", leads: 248, spend: "₹9.4L", cpl: "₹3,790", trend: "+6%", isPositive: true },
            { name: "Premium Card Upsell", leads: 201, spend: "₹3.1L", cpl: "₹1,542", trend: "-3%", isPositive: false },
            { name: "UHNI Referral Drive", leads: 158, spend: "₹5.2L", cpl: "₹3,291", trend: "+18%", isPositive: true },
            { name: "Mass Affluent Starter", leads: 140, spend: "₹1.8L", cpl: "₹1,286", trend: "-7%", isPositive: false }
          ],
          forecastData: [
            { label: "W1", forecast: 80, actual: 75 },
            { label: "W2", forecast: 85, actual: 82 },
            { label: "W3", forecast: 90, actual: 88 },
            { label: "W4", forecast: 95, actual: 91 },
            { label: "W5", forecast: 100, actual: 96 },
            { label: "W6", forecast: 105, actual: 102 }
          ],
          forecastPercent: "Actual tracking 3.3% below forecast",
          donutTotal: "1,284",
          donutSlices: { massAffluent: 46, hni: 38, uhni: 16 }
        };
    }
  }, [selectedPeriod]);

  // Extract variables out of the active data set
  const {
    kpiMetrics,
    pacingCampaigns,
    rawLeadsData,
    spendDataPoints,
    categories,
    confidenceTiers,
    geography,
    campaignsTable,
    forecastData,
    forecastPercent,
    donutTotal,
    donutSlices
  } = activeData;

  // 2. Mathematically compute leads Received Line Chart coordinates dynamically
  const leadsReceivedData = useMemo(() => {
    const maxVal = Math.max(...rawLeadsData.map(d => d.val), 1);
    return rawLeadsData.map((d, idx) => {
      const x = 40 + idx * (540 / Math.max(rawLeadsData.length - 1, 1));
      const y = 170 - (d.val / maxVal) * 130;
      return { ...d, x, y };
    });
  }, [rawLeadsData]);

  // 3. Mathematically compute Spend vs Budget Cumulative line coordinates dynamically
  const spendCoords = useMemo(() => {
    const maxVal = Math.max(...spendDataPoints.flatMap(d => [d.spend, d.cap]), 1);
    return spendDataPoints.map((dp, idx) => {
      const x = 40 + idx * (540 / Math.max(spendDataPoints.length - 1, 1));
      const ySpend = 170 - (dp.spend / maxVal) * 130;
      const yCap = 170 - (dp.cap / maxVal) * 130;
      return { ...dp, x, ySpend, yCap };
    });
  }, [spendDataPoints]);

  // 3b. Mathematically compute Actual CAC vs Target CAC coordinates over time
  const cacTrendCoords = useMemo(() => {
    const rawTrend = [
      { label: "Mon", actual: 340, target: 380 },
      { label: "Tue", actual: 410, target: 380 },
      { label: "Wed", actual: 450, target: 380 },
      { label: "Thu", actual: 390, target: 380 },
      { label: "Fri", actual: 420, target: 380 },
      { label: "Sat", actual: 330, target: 380 },
      { label: "Sun", actual: 365, target: 380 }
    ];
    
    const maxVal = 600;
    return rawTrend.map((pt, idx) => {
      const x = 40 + idx * (540 / Math.max(rawTrend.length - 1, 1));
      const yActual = 170 - (pt.actual / maxVal) * 130;
      const yTarget = 170 - (pt.target / maxVal) * 130;
      return { ...pt, x, yActual, yTarget };
    });
  }, []);

  const computedTableCampaigns = useMemo(() => {
    if (campaigns && campaigns.length > 0) {
      return campaigns.map(c => {
        const leads = c.leadsAcquired || 0;
        const spendVal = c.currentSpend || 0;
        const actualCpl = leads > 0 ? Math.round(spendVal / leads) : 0;
        const targetCac = c.targetCAC || 2500;
        const isWithin = actualCpl <= targetCac;
        
        return {
          name: c.name,
          leads,
          spend: spendVal > 100000 ? `₹${(spendVal / 100000).toFixed(1)}L` : `₹${spendVal.toLocaleString('en-IN')}`,
          targetCac: `₹${targetCac.toLocaleString('en-IN')}`,
          actualCac: actualCpl > 0 ? `₹${actualCpl.toLocaleString('en-IN')}` : '—',
          isWithin,
          rawActualCpl: actualCpl,
        };
      }).sort((a, b) => b.leads - a.leads);
    }
    
    return [
      { name: "Festive Season Push", leads: 312, spend: "₹6.8L", targetCac: "₹2,500", actualCac: "₹2,179", isWithin: true, rawActualCpl: 2179 },
      { name: "HNI Wealth Onboarding", leads: 248, spend: "₹9.4L", targetCac: "₹3,500", actualCac: "₹3,790", isWithin: false, rawActualCpl: 3790 },
      { name: "Premium Card Upsell", leads: 201, spend: "₹3.1L", targetCac: "₹1,800", actualCac: "₹1,542", isWithin: true, rawActualCpl: 1542 },
      { name: "UHNI Referral Drive", leads: 158, spend: "₹5.2L", targetCac: "₹3,000", actualCac: "₹3,291", isWithin: false, rawActualCpl: 3291 },
      { name: "Mass Affluent Starter", leads: 140, spend: "₹1.8L", targetCac: "₹1,500", actualCac: "₹1,286", isWithin: true, rawActualCpl: 1286 }
    ];
  }, [campaigns]);

  // Dynamically compute rolled-up numbers across active campaigns for the active period
  const activeCampaignsList = useMemo(() => {
    return campaigns.filter(c => c.status === 'Active');
  }, [campaigns]);

  const totalLeadsReceivedCount = useMemo(() => {
    const sum = campaigns.reduce((acc, c) => acc + (c.leadsAcquired || 0), 0);
    // fallback if no campaigns or sum is 0
    return sum > 0 ? sum : 1284;
  }, [campaigns]);

  const activeCampaignsCount = useMemo(() => {
    return campaigns.filter(c => c.status === 'Active').length || 10;
  }, [campaigns]);

  const totalSpendVal = useMemo(() => {
    const sum = campaigns.reduce((acc, c) => acc + (c.currentSpend || 0), 0);
    return sum > 0 ? sum : 1860000;
  }, [campaigns]);

  // Actual CAC vs. Target CAC comparison calculations (across active campaigns)
  const cacStats = useMemo(() => {
    const activeCamps = campaigns.filter(c => c.status === 'Active');
    const totalLeads = activeCamps.reduce((acc, c) => acc + (c.leadsAcquired || 0), 0);
    const totalSpend = activeCamps.reduce((acc, c) => acc + (c.currentSpend || 0), 0);
    
    // Calculate actual rolling average CAC
    const actualCAC = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 420;
    
    // Calculate target average CAC
    const totalTarget = activeCamps.reduce((acc, c) => acc + (c.targetCAC || 2500), 0);
    const targetCAC = activeCamps.length > 0 ? Math.round(totalTarget / activeCamps.length) : 380;
    
    const diffPercent = targetCAC > 0 ? Math.round(((actualCAC - targetCAC) / targetCAC) * 100) : 0;
    const overUnderLabel = diffPercent > 0 ? `${diffPercent}% over` : `${Math.abs(diffPercent)}% under`;
    
    return {
      actualCAC,
      targetCAC,
      diffPercent,
      overUnderLabel
    };
  }, [campaigns]);

  // Campaigns within vs outside target
  const pacingCountStats = useMemo(() => {
    const activeCamps = campaigns.filter(c => c.status === 'Active');
    let within = 0;
    let outside = 0;
    
    activeCamps.forEach(c => {
      const actualCpl = c.leadsAcquired > 0 ? Math.round(c.currentSpend / c.leadsAcquired) : 0;
      const target = c.targetCAC || 2500;
      if (actualCpl > target) {
        outside++;
      } else {
        within++;
      }
    });

    // Fallback if none are active
    if (activeCamps.length === 0) {
      within = 6;
      outside = 2;
    }

    return { within, outside };
  }, [campaigns]);

  // Dynamic leads actioned computation
  const leadsActionedCount = useMemo(() => {
    return Math.round(totalLeadsReceivedCount * 0.75);
  }, [totalLeadsReceivedCount]);

  return (
    <div className="space-y-6 pb-12 select-none font-sans">
      
      {/* 1. KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Tile 1: Total Leads Received */}
        <div className="bg-white border border-neutral-200/60 rounded-xl p-5 hover:shadow-md hover:border-neutral-300 transition-all duration-200 flex flex-col justify-between">
          <div>
            <span className="text-xs text-neutral-400 block font-semibold truncate">Total leads received</span>
            <div className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
              {totalLeadsReceivedCount.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1">
            <TrendingUp size={12} className="text-[#10b981]" />
            <span className="text-[10.5px] font-bold tracking-wide text-[#10b981]">+4.2% vs prev period</span>
          </div>
        </div>

        {/* Tile 2: Active Campaigns */}
        <div className="bg-white border border-neutral-200/60 rounded-xl p-5 hover:shadow-md hover:border-neutral-300 transition-all duration-200 flex flex-col justify-between">
          <div>
            <span className="text-xs text-neutral-400 block font-semibold truncate">Active campaigns</span>
            <div className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
              {activeCampaignsCount}
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1">
            <span className="text-[10.5px] font-bold tracking-wide text-neutral-500">+1 campaign vs prev</span>
          </div>
        </div>

        {/* Tile 3: Total Spend */}
        <div className="bg-white border border-neutral-200/60 rounded-xl p-5 hover:shadow-md hover:border-neutral-300 transition-all duration-200 flex flex-col justify-between">
          <div>
            <span className="text-xs text-neutral-400 block font-semibold truncate">Total spend</span>
            <div className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
              ₹{(totalSpendVal / 100000).toFixed(1)}L
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1">
            <TrendingUp size={12} className="text-[#10b981]" />
            <span className="text-[10.5px] font-bold tracking-wide text-[#10b981]">+3.8% vs prev period</span>
          </div>
        </div>

        {/* Tile 4: Actual CAC vs. Target CAC (CHANGED - replaces Avg Cost Per Lead) */}
        <div className="bg-white border border-neutral-200/60 rounded-xl p-5 hover:shadow-md hover:border-neutral-300 transition-all duration-200 flex flex-col justify-between">
          <div>
            <span className="text-xs text-neutral-400 block font-semibold truncate flex items-center gap-1">
              <span>Actual vs Target CAC</span>
              <HelpCircle size={11} className="text-neutral-300 shrink-0" title="Blended average actual cost per lead vs target commitments across active campaigns" />
            </span>
            <div className="text-xl font-extrabold tracking-tight text-neutral-900 mt-2 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-neutral-900">₹{cacStats.actualCAC}</span>
              <span className="text-xs text-neutral-400 font-medium">vs. ₹{cacStats.targetCAC}</span>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1 flex-wrap">
            {cacStats.diffPercent > 0 ? (
              <TrendingUp size={12} className="text-amber-500 shrink-0" />
            ) : (
              <TrendingDown size={12} className="text-emerald-500 shrink-0" />
            )}
            <span className={`text-[10px] font-extrabold tracking-wide px-1.5 py-0.5 rounded ${
              cacStats.diffPercent > 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}>
              {cacStats.overUnderLabel}
            </span>
          </div>
        </div>

        {/* Tile 5: Campaigns within target / outside target (NEW - plain count) */}
        <div className="bg-white border border-neutral-200/60 rounded-xl p-5 hover:shadow-md hover:border-neutral-300 transition-all duration-200 flex flex-col justify-between">
          <div>
            <span className="text-xs text-neutral-400 block font-semibold truncate">Campaign target audit</span>
            <div className="text-xl font-extrabold tracking-tight text-neutral-900 mt-2">
              {pacingCountStats.within} within <span className="text-neutral-300 mx-1">&middot;</span> {pacingCountStats.outside} outside
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px] text-neutral-400 font-bold">
            <span>Commitment status</span>
          </div>
        </div>

        {/* Tile 6: Leads Actioned This Week */}
        <div className="bg-white border border-neutral-200/60 rounded-xl p-5 hover:shadow-md hover:border-neutral-300 transition-all duration-200 flex flex-col justify-between">
          <div>
            <span className="text-xs text-neutral-400 block font-semibold truncate">Leads actioned this week</span>
            <div className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
              {leadsActionedCount.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1">
            <TrendingUp size={12} className="text-[#10b981]" />
            <span className="text-[10.5px] font-bold tracking-wide text-[#10b981]">+8.2% vs prev period</span>
          </div>
        </div>

      </div>

      {/* 2. Budget Pacing Panel */}
      <div className="bg-white border border-neutral-200/60 rounded-xl p-6 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Budget pacing</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">Spend vs. cap per active campaign</p>
          </div>
          <button className="text-[11px] font-semibold text-[#3b82f6] hover:text-[#2563eb] transition-colors cursor-pointer">
            View all campaigns &rarr;
          </button>
        </div>

        <div className="space-y-4">
          {pacingCampaigns.map((camp, idx) => (
            <div 
              key={idx} 
              className="group"
              onMouseEnter={() => setActiveBudgetHover(idx)}
              onMouseLeave={() => setActiveBudgetHover(null)}
            >
              <div className="flex items-center justify-between text-xs font-medium text-neutral-700 mb-1.5">
                <span className="group-hover:text-neutral-900 transition-colors font-medium">{camp.name}</span>
                <span className="text-neutral-500 text-[11.5px]">
                  <strong className="text-neutral-900 font-bold">{camp.spent}</strong> / {camp.cap} &bull; <span className="font-bold text-neutral-800">{camp.percent}% of cap</span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${camp.colorClass}`}
                  style={{ width: `${camp.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Charts Area (Leads, Spend, and CAC Pacing Over Time) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart A: Leads Received Over Time */}
        <div className="bg-white border border-neutral-200/60 rounded-xl p-6 hover:shadow-md transition-all">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-neutral-900">Leads received over time</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">Leads received volume, {selectedPeriod}</p>
          </div>

          <div className="relative w-full h-[200px]">
            {/* SVG Area Line Chart */}
            <svg viewBox="0 0 620 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="leadsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[40, 80, 120, 160].map((yVal, i) => (
                <line 
                  key={i} 
                  x1="20" 
                  y1={yVal} 
                  x2="600" 
                  y2={yVal} 
                  stroke="#f1f5f9" 
                  strokeWidth="1" 
                />
              ))}

              {/* Gradient Shading */}
              {leadsReceivedData.length > 1 && (
                <path 
                  d={`M ${leadsReceivedData[0].x} 170 L ${leadsReceivedData.map(pt => `${pt.x} ${pt.y}`).join(' L ')} L ${leadsReceivedData[leadsReceivedData.length-1].x} 170 Z`}
                  fill="url(#leadsAreaGrad)"
                />
              )}

              {/* Line path */}
              <path 
                d={leadsReceivedData.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {leadsReceivedData.map((pt, i) => (
                <g key={i} className="group/dot cursor-pointer">
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="4" 
                    fill="#ffffff" 
                    stroke="#3b82f6" 
                    strokeWidth="2.5" 
                    className="transition-transform duration-200 group-hover/dot:scale-150"
                  />
                  <text 
                    x={pt.x} 
                    y={pt.y - 12} 
                    textAnchor="middle" 
                    className="opacity-0 group-hover/dot:opacity-100 transition-opacity bg-neutral-900 text-white text-[10px] font-bold"
                    fill="#1e293b"
                  >
                    {pt.val}
                  </text>
                </g>
              ))}

              {/* Axis labels */}
              {leadsReceivedData.map((pt, i) => (
                <text 
                  key={i} 
                  x={pt.x} 
                  y="185" 
                  textAnchor="middle" 
                  className="fill-neutral-400 text-[10px] font-semibold"
                >
                  {pt.day}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Chart B: Spend vs Budget Over Time */}
        <div className="bg-white border border-neutral-200/60 rounded-xl p-6 hover:shadow-md transition-all">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-neutral-900">Spend vs. budget over time</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">Cumulative trend, {selectedPeriod}</p>
          </div>

          <div className="relative w-full h-[200px]">
            <svg viewBox="0 0 620 200" className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              {[40, 80, 120, 160].map((yVal, i) => (
                <line 
                  key={i} 
                  x1="20" 
                  y1={yVal} 
                  x2="600" 
                  y2={yVal} 
                  stroke="#f1f5f9" 
                  strokeWidth="1" 
                />
              ))}

              {/* Cumulative Budget Line (Dashed Slate) */}
              <path 
                d={spendCoords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.yCap}`).join(' ')}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />

              {/* Cumulative Spend Line (Solid Blue) */}
              <path 
                d={spendCoords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.ySpend}`).join(' ')}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Interactive nodes */}
              {spendCoords.map((pt, i) => (
                <g key={i} className="group/spend cursor-pointer">
                  <circle cx={pt.x} cy={pt.ySpend} r="3.5" fill="#2563eb" />
                  <circle cx={pt.x} cy={pt.yCap} r="3" fill="#94a3b8" />
                </g>
              ))}

              {/* Axis Labels */}
              {spendCoords.map((pt, i) => (
                <text 
                  key={i} 
                  x={pt.x} 
                  y="185" 
                  textAnchor="middle" 
                  className="fill-neutral-400 text-[10px] font-semibold"
                >
                  {pt.day}
                </text>
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-2 text-[11px] text-neutral-500 font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#2563eb] inline-block" />
              <span>Spend</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-[#cbd5e1] inline-block" />
              <span>Budget cap</span>
            </div>
          </div>
        </div>

        {/* Chart C: Actual CAC vs. Target CAC Over Time */}
        <div className="bg-white border border-neutral-200/60 rounded-xl p-6 hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-neutral-900">Actual CAC vs. Target CAC over time</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">Rolling cost per lead vs. Target CAC commitment</p>
            </div>

            <div className="relative w-full h-[200px]">
              <svg viewBox="0 0 620 200" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="cacAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[40, 80, 120, 160].map((yVal, i) => (
                  <line 
                    key={i} 
                    x1="20" 
                    y1={yVal} 
                    x2="600" 
                    y2={yVal} 
                    stroke="#f1f5f9" 
                    strokeWidth="1" 
                  />
                ))}

                {/* Target CAC committed line (Crimson dashed reference) */}
                <path 
                  d={cacTrendCoords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.yTarget}`).join(' ')}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />

                {/* Actual CAC Area fill */}
                {cacTrendCoords.length > 1 && (
                  <path 
                    d={`M ${cacTrendCoords[0].x} 170 L ${cacTrendCoords.map(pt => `${pt.x} ${pt.yActual}`).join(' L ')} L ${cacTrendCoords[cacTrendCoords.length-1].x} 170 Z`}
                    fill="url(#cacAreaGrad)"
                  />
                )}

                {/* Actual CAC trend line (Solid Slate-Blue) */}
                <path 
                  d={cacTrendCoords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.yActual}`).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {cacTrendCoords.map((pt, i) => (
                  <g key={i} className="group/cac cursor-pointer">
                    <circle 
                      cx={pt.x} 
                      cy={pt.yActual} 
                      r="4" 
                      fill="#ffffff" 
                      stroke={pt.yActual < pt.yTarget ? "#ef4444" : "#10b981"} 
                      strokeWidth="2.5" 
                      className="transition-transform duration-200 hover:scale-150"
                    />
                  </g>
                ))}

                {/* Axis Labels */}
                {cacTrendCoords.map((pt, i) => (
                  <text 
                    key={i} 
                    x={pt.x} 
                    y="185" 
                    textAnchor="middle" 
                    className="fill-neutral-400 text-[10px] font-semibold"
                  >
                    {pt.label}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-[11px] text-neutral-500 font-semibold border-t border-neutral-100 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#3b82f6] inline-block" />
              <span>Actual CAC (Avg: ₹{cacStats.actualCAC})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-[#ef4444] inline-block" />
              <span>Target (Committed: ₹{cacStats.targetCAC})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Three-Column Distribution & Persona Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Leads by category */}
        <div className="bg-white border border-neutral-200/60 rounded-xl p-6 hover:shadow-md transition-all">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-neutral-900">Leads by category</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">What kind of leads are arriving</p>
          </div>

          <div className="space-y-4">
            {categories.map((cat, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-xs text-neutral-600 mb-1 font-semibold">
                  <span>{cat.name}</span>
                  <span className="text-neutral-900 font-bold">{cat.percent}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${cat.colorClass}`}
                    style={{ width: `${cat.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Leads by confidence */}
        <div className="bg-white border border-neutral-200/60 rounded-xl p-6 hover:shadow-md transition-all">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-neutral-900">Leads by confidence</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">Quality tier delivered by the engine</p>
          </div>

          <div className="space-y-4">
            {confidenceTiers.map((tier, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-xs text-neutral-600 mb-1 font-semibold">
                  <span>{tier.name}</span>
                  <span className="text-neutral-900 font-bold">{tier.percent}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${tier.colorClass}`}
                    style={{ width: `${tier.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Leads by persona (Donut chart) */}
        <div className="bg-white border border-neutral-200/60 rounded-xl p-6 hover:shadow-md transition-all">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-neutral-900">Leads by persona</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">Wealth-tier mix vs. target</p>
          </div>

          <div className="flex items-center gap-6">
            {/* SVG Donut */}
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* Gray back segment */}
                <circle 
                  cx="18" 
                  cy="18" 
                  r="15.915" 
                  fill="transparent" 
                  stroke="#f1f5f9" 
                  strokeWidth="3.2" 
                />

                {/* Mass Affluent slice */}
                <circle 
                  cx="18" 
                  cy="18" 
                  r="15.915" 
                  fill="transparent" 
                  stroke="#93c5fd" 
                  strokeWidth="3.2" 
                  strokeDasharray={`${donutSlices.massAffluent} ${100 - donutSlices.massAffluent}`}
                  strokeDashoffset="0"
                />

                {/* HNI slice */}
                <circle 
                  cx="18" 
                  cy="18" 
                  r="15.915" 
                  fill="transparent" 
                  stroke="#3b82f6" 
                  strokeWidth="3.2" 
                  strokeDasharray={`${donutSlices.hni} ${100 - donutSlices.hni}`}
                  strokeDashoffset={`-${donutSlices.massAffluent}`}
                />

                {/* UHNI slice */}
                <circle 
                  cx="18" 
                  cy="18" 
                  r="15.915" 
                  fill="transparent" 
                  stroke="#1e3a8a" 
                  strokeWidth="3.2" 
                  strokeDasharray={`${donutSlices.uhni} ${100 - donutSlices.uhni}`}
                  strokeDashoffset={`-${donutSlices.massAffluent + donutSlices.hni}`}
                />
              </svg>

              {/* Central text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-extrabold text-neutral-800 leading-none">{donutTotal}</span>
                <span className="text-[8px] text-neutral-400 uppercase tracking-widest font-mono mt-0.5">leads</span>
              </div>
            </div>

            {/* Legend list */}
            <div className="space-y-2 text-xs font-semibold flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#93c5fd]" />
                <span className="text-neutral-500 font-medium">Mass Affluent</span>
                <span className="text-neutral-800 font-bold ml-auto">{donutSlices.massAffluent}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                <span className="text-neutral-500 font-medium">HNI</span>
                <span className="text-neutral-800 font-bold ml-auto">{donutSlices.hni}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1e3a8a]" />
                <span className="text-neutral-500 font-medium">UHNI</span>
                <span className="text-neutral-800 font-bold ml-auto">{donutSlices.uhni}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Campaign Listings and Geography */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Top Campaigns Table (3 columns wide) */}
        <div className="bg-white border border-neutral-200/60 rounded-xl p-6 hover:shadow-md transition-all lg:col-span-3">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Top campaigns</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">Performance stack of the active period</p>
            </div>
            <button className="text-[11px] font-semibold text-[#3b82f6] hover:text-[#2563eb] transition-colors cursor-pointer">
              View lead feed &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-semibold pb-2 text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 font-semibold">#</th>
                  <th className="py-2.5 font-semibold">Campaign</th>
                  <th className="py-2.5 text-right font-semibold">Leads</th>
                  <th className="py-2.5 text-right font-semibold">Spend</th>
                  <th className="py-2.5 text-right font-semibold">Target CAC</th>
                  <th className="py-2.5 text-right font-semibold">Actual CAC</th>
                  <th className="py-2.5 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {computedTableCampaigns.map((camp, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => {
                      onNavigateToManagement?.(camp.isWithin ? 'Within Target' : 'Outside Target');
                    }}
                    className="hover:bg-neutral-50 cursor-pointer transition-colors group"
                    title="Click to view & audit in Campaign Management"
                  >
                    <td className="py-3 text-neutral-400 font-medium">{idx + 1}</td>
                    <td className="py-3 text-neutral-800 font-bold group-hover:text-[#3b82f6] transition-colors">
                      {camp.name}
                    </td>
                    <td className="py-3 text-right text-neutral-700 font-semibold">{camp.leads}</td>
                    <td className="py-3 text-right text-neutral-700 font-semibold">{camp.spend}</td>
                    <td className="py-3 text-right text-neutral-500 font-medium">{camp.targetCac}</td>
                    <td className="py-3 text-right text-neutral-900 font-bold">{camp.actualCac}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block border ${
                        camp.isWithin 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {camp.isWithin ? 'Within Target' : 'Outside Target'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Extended Geography Card (Taking 2 columns and styled perfectly to match table height) */}
        <div className="lg:col-span-2 bg-white border border-neutral-200/60 rounded-xl p-6 hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Geography</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">Where leads are concentrated</p>
          </div>

          {/* Dynamically spaced list of cities with clean progressive bars */}
          <div className="space-y-4 py-3 flex-1 flex flex-col justify-around">
            {geography.map((geo, idx) => (
              <div key={idx} className="w-full">
                <div className="flex justify-between text-xs text-neutral-600 mb-1 font-semibold">
                  <span>{geo.city}</span>
                  <span className="text-neutral-900 font-bold">{geo.percent}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[#3b82f6] transition-all duration-500"
                    style={{ width: `${geo.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 6. Forecast vs. Actual Delivery (Full width bottom row) */}
      <div className="bg-white border border-neutral-200/60 rounded-xl p-6 hover:shadow-md transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Forecast vs. actual delivery</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">Can the platform's own estimate be trusted?</p>
          </div>

          <div className="px-3 py-1.5 bg-[#fef3c7] border border-[#f59e0b]/15 rounded-lg text-neutral-800 text-[10.5px] font-bold tracking-wide shadow-sm shrink-0 self-start sm:self-center">
            {forecastPercent}
          </div>
        </div>

        {/* Double Bar chart */}
        <div className="relative w-full h-[180px] mt-2">
          <div className="absolute inset-0 flex items-end justify-between px-6 z-10">
            {forecastData.map((data, idx) => {
              const maxForecastVal = Math.max(...forecastData.flatMap(d => [d.forecast, d.actual]), 1);
              const forecastHeight = (data.forecast / maxForecastVal) * 100;
              const actualHeight = (data.actual / maxForecastVal) * 100;

              return (
                <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer">
                  {/* Pair of bars */}
                  <div className="flex items-end gap-1.5 h-[110px] w-12 justify-center">
                    {/* Forecast bar (Beautiful solid light gray - now visible!) */}
                    <div 
                      className="w-3.5 bg-neutral-200 group-hover:bg-neutral-300 rounded-t-sm transition-all duration-300"
                      style={{ height: `${forecastHeight}%` }}
                      title={`Forecast: ${data.forecast}`}
                    />
                    {/* Actual bar (Solid Blue) */}
                    <div 
                      className="w-3.5 bg-[#2563eb] group-hover:bg-[#1d4ed8] rounded-t-sm transition-all duration-300"
                      style={{ height: `${actualHeight}%` }}
                      title={`Actual: ${data.actual}`}
                    />
                  </div>

                  {/* Label */}
                  <span className="text-[11px] font-semibold text-neutral-400 group-hover:text-neutral-800 transition-colors">
                    {data.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Background horizontal grid lines for visual references */}
          <div className="absolute left-6 right-6 bottom-[35px] h-[1px] border-b border-neutral-100 pointer-events-none" />
          <div className="absolute left-6 right-6 bottom-[65px] h-[1px] border-b border-neutral-100 pointer-events-none" />
          <div className="absolute left-6 right-6 bottom-[95px] h-[1px] border-b border-neutral-100 pointer-events-none" />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-[11px] text-neutral-500 font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-neutral-200 rounded-sm inline-block" />
            <span>Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#2563eb] rounded-sm inline-block" />
            <span>Actual</span>
          </div>
        </div>
      </div>

    </div>
  );
};
