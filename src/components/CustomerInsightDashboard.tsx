import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Layers, 
  ShieldAlert, 
  PlusCircle, 
  ArrowRight, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export interface QualFile {
  id: string;
  fileName: string;
  fileSize: string;
  rowsAccepted: number;
  rowsSkipped: number;
  skipReasons: Array<{ count: number; reason: string }>;
  cost: number;
  dateUploaded: string;
  status: 'Completed' | 'Processing' | 'Failed';
}

export interface QualCampaign {
  id: string;
  name: string;
  filesCount: number;
  peopleScored: number;
  uploadedBy: string;
  status: 'Completed' | 'Processing' | 'Queued' | 'Failed';
  dateCreated: string;
  totalSpend: number;
  targetProduct: string;
  weights: { incomeWeight: number; spendWeight: number; propensityWeight: number };
  confidenceStats: { high: number; medium: number; low: number };
  industry?: string;
  capitalProfile?: string;
  targetRegion?: string;
  customerSegment?: string;
  hasRunFirstFile?: boolean;
  isArchived?: boolean;
  activityLog?: string[];
  files?: QualFile[];
}

interface CustomerInsightDashboardProps {
  campaigns: QualCampaign[];
  onNavigate: (view: 'builder' | 'management', campaignId?: string) => void;
}

export const CustomerInsightDashboard: React.FC<CustomerInsightDashboardProps> = ({ campaigns, onNavigate }) => {
  const [datePeriod, setDatePeriod] = useState<'This week' | 'Last week' | 'This month' | 'Year to date'>('This month');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Parse campaign created dates relative to "now" (2026-09-17)
  const filteredCampaigns = useMemo(() => {
    const referenceDate = new Date("2026-09-17T00:00:00");
    
    return campaigns.filter(c => {
      if (c.isArchived) return false;
      const created = new Date(c.dateCreated);
      const diffTime = referenceDate.getTime() - created.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (datePeriod === 'This week') {
        return diffDays >= 0 && diffDays <= 7;
      }
      if (datePeriod === 'Last week') {
        return diffDays > 7 && diffDays <= 14;
      }
      if (datePeriod === 'This month') {
        return diffDays >= 0 && diffDays <= 30;
      }
      if (datePeriod === 'Year to date') {
        return diffDays >= 0 && diffDays <= 365;
      }
      return true;
    });
  }, [campaigns, datePeriod]);

  // Recalculate stat tiles in real-time
  const metrics = useMemo(() => {
    const activeCampaigns = filteredCampaigns.filter(c => c.status !== 'Failed');
    
    const campaignsCount = filteredCampaigns.length;
    
    let totalPeopleProfiled = 0;
    let totalFilesProcessed = 0;
    let totalRowsSkipped = 0;
    
    filteredCampaigns.forEach(c => {
      totalPeopleProfiled += c.peopleScored || 0;
      const files = c.files || [];
      totalFilesProcessed += files.length;
      
      files.forEach(f => {
        totalRowsSkipped += f.rowsSkipped || 0;
      });
    });

    // Data-quality rate (% Insufficient / thin-footprint)
    // Formula: (Skipped Rows + Estimated Thin-Footprint records where profile is marginal) / total rows evaluated
    const estimatedThinFootprint = Math.round(totalPeopleProfiled * 0.08); // 8% of accepted profiles have sparse bureau trails
    const totalProcessedLeads = totalPeopleProfiled + totalRowsSkipped;
    const thinFootprintRate = totalProcessedLeads > 0 
      ? ((totalRowsSkipped + estimatedThinFootprint) / totalProcessedLeads) * 100 
      : 0;

    return {
      campaignsCount,
      totalPeopleProfiled,
      totalFilesProcessed,
      thinFootprintRate: Math.min(thinFootprintRate, 100)
    };
  }, [filteredCampaigns]);

  // Population-level Top Categories Rollup for dynamic Chart
  const categoriesRollup = useMemo(() => {
    const rollup: Record<string, number> = {};
    
    filteredCampaigns.forEach(c => {
      const product = c.targetProduct || "Wealth Advisory";
      const count = c.peopleScored || 0;
      rollup[product] = (rollup[product] || 0) + count;
    });

    // Map to array for charting with premium colors
    const premiumColors: Record<string, string> = {
      "Wealth Advisory": "#1e40af", // Premium Royal Blue
      "Mutual Funds": "#2563eb",   // Cobalt Blue
      "Credit Cards": "#3b82f6",   // Azure Blue
      "Insurance": "#60a5fa",      // Sky Blue
      "Legacy Trust": "#93c5fd"    // Light Ice Blue
    };

    const data = Object.entries(rollup).map(([name, value]) => ({
      name,
      value,
      color: premiumColors[name] || "#bfdbfe"
    })).sort((a, b) => b.value - a.value);

    const grandTotal = data.reduce((acc, curr) => acc + curr.value, 0) || 1;

    return data.map(item => ({
      ...item,
      percentage: Math.round((item.value / grandTotal) * 100)
    }));
  }, [filteredCampaigns]);

  // Pie chart variables
  const grandTotalScored = useMemo(() => {
    return categoriesRollup.reduce((acc, c) => acc + c.value, 0);
  }, [categoriesRollup]);

  // Construct SVG parameters for Donut Arc Chart
  const donutArcs = useMemo(() => {
    let accumulatedPercent = 0;
    return categoriesRollup.map((cat) => {
      const startPercent = accumulatedPercent;
      accumulatedPercent += (cat.value / (grandTotalScored || 1));
      const endPercent = accumulatedPercent;

      // Circle coordinates helper
      const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
      };

      const [startX, startY] = getCoordinatesForPercent(startPercent);
      const [endX, endY] = getCoordinatesForPercent(endPercent);

      const largeArcFlag = (endPercent - startPercent) > 0.5 ? 1 : 0;

      // Map coordinates to radius 50, center 60
      const r = 40;
      const cx = 60;
      const cy = 60;

      const pathData = [
        `M ${cx + startX * r} ${cy + startY * r}`,
        `A ${r} ${r} 0 ${largeArcFlag} 1 ${cx + endX * r} ${cy + endY * r}`
      ].join(' ');

      return {
        pathData,
        color: cat.color,
        name: cat.name,
        percentage: cat.percentage,
        value: cat.value
      };
    });
  }, [categoriesRollup, grandTotalScored]);

  // Helper for dynamic row campaign status helper
  const getDisplayStatus = (camp: QualCampaign): { label: string; style: string } => {
    if (camp.status === 'Failed' || (camp.files && camp.files.some(f => f.status === 'Failed'))) {
      return { label: 'Failed', style: 'bg-rose-50 border-rose-200 text-rose-700' };
    }
    if (!camp.files || camp.files.length === 0) {
      return { label: 'Draft', style: 'bg-neutral-50 border-neutral-200 text-neutral-600' };
    }
    if (camp.files.some(f => f.status === 'Processing')) {
      return { label: 'Processing', style: 'bg-blue-50 border-blue-200 text-blue-700' };
    }
    if (camp.files.some(f => f.rowsSkipped > 20)) {
      return { label: 'Partial failure', style: 'bg-amber-50 border-amber-200 text-amber-700' };
    }
    return { label: 'Completed', style: 'bg-emerald-50 border-emerald-200 text-emerald-700' };
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-neutral-200/50">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2.5 font-sans">
            <span>Customer Insight Dashboard</span>
            <span className="bg-blue-50 text-blue-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-blue-100">
              Insight Analytics Active
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-semibold leading-relaxed">
            Portfolio-level audience diagnostics, data quality checks, throughput rollups, and recent profiling runs.
          </p>
        </div>

        {/* Date Filter selector */}
        <div className="flex items-center gap-2.5 self-start md:self-center">
          <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <Calendar size={13} className="text-neutral-400" />
            <select
              value={datePeriod}
              onChange={(e) => setDatePeriod(e.target.value as any)}
              className="bg-transparent border-none text-xs font-bold text-neutral-600 focus:outline-none cursor-pointer"
            >
              <option value="This week">This Week</option>
              <option value="Last week">Last Week</option>
              <option value="This month">This Month</option>
              <option value="Year to date">Year to Date</option>
            </select>
          </div>

          <button
            onClick={() => onNavigate('builder')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#1e40af] hover:bg-[#1d4ed8] active:scale-95 text-white rounded-lg shadow-md transition-all cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* 4 Flat Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        
        {/* Stat 1: Campaigns Run */}
        <div className="bg-white border border-neutral-200/60 p-5 rounded-xl shadow-xs space-y-1">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider font-mono">Campaigns Run</span>
            <div className="p-1.5 bg-neutral-50 rounded text-neutral-500">
              <Briefcase size={14} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-neutral-800 tracking-tight">{metrics.campaignsCount}</h3>
          <p className="text-[9.5px] text-neutral-400 font-bold">Profiling batches run in period</p>
        </div>

        {/* Stat 2: People Profiled */}
        <div className="bg-white border border-neutral-200/60 p-5 rounded-xl shadow-xs space-y-1">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider font-mono">People Profiled</span>
            <div className="p-1.5 bg-neutral-50 rounded text-neutral-500">
              <Users size={14} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-neutral-800 tracking-tight">{metrics.totalPeopleProfiled.toLocaleString('en-IN')}</h3>
          <p className="text-[9.5px] text-neutral-400 font-bold">Total individuals scored</p>
        </div>

        {/* Stat 3: Files Processed */}
        <div className="bg-white border border-neutral-200/60 p-5 rounded-xl shadow-xs space-y-1">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider font-mono">Files Processed</span>
            <div className="p-1.5 bg-neutral-50 rounded text-neutral-500">
              <Layers size={14} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-neutral-800 tracking-tight">{metrics.totalFilesProcessed}</h3>
          <p className="text-[9.5px] text-neutral-400 font-bold">Total roster CSV/Excel uploads</p>
        </div>

        {/* Stat 4: Data-quality rate */}
        <div className="bg-white border border-neutral-200/60 p-5 rounded-xl shadow-xs space-y-1">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider font-mono text-amber-600">Data-Quality Rate</span>
            <div className={`p-1.5 rounded ${metrics.thinFootprintRate > 15 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <ShieldAlert size={14} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-neutral-800 tracking-tight">
            {metrics.thinFootprintRate.toFixed(1)}%
          </h3>
          <p className="text-[9.5px] text-neutral-400 font-bold">
            <span className="text-neutral-500 font-semibold">% Insufficient / thin-footprint</span>
          </p>
        </div>
      </div>

      {/* Middle Layout: Donut Chart on Left, Recent Campaigns on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Categories Donut Chart Card */}
        <div className="bg-white border border-neutral-200/60 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase text-neutral-400 tracking-wider font-mono">Population-Level Top Categories</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5 font-medium leading-relaxed">
              Consolidated portfolio distribution by target banking offerings across all profiles in this period.
            </p>
          </div>

          {categoriesRollup.length > 0 ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-5">
              
              {/* Dynamic SVG Donut Stage */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="-rotate-90 w-full h-full">
                  <circle cx="60" cy="60" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="11" />
                  
                  {donutArcs.map((arc, aIdx) => (
                    <path
                      key={aIdx}
                      d={arc.pathData}
                      fill="transparent"
                      stroke={arc.color}
                      strokeWidth={hoveredCategory === arc.name ? "14" : "11"}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredCategory(arc.name)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    />
                  ))}
                </svg>

                {/* Central Stat Ring Info */}
                <div className="absolute text-center select-none pointer-events-none leading-none">
                  <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider block">Total Scored</span>
                  <strong className="text-base font-black text-neutral-800 mt-1 block">
                    {hoveredCategory 
                      ? (categoriesRollup.find(c => c.name === hoveredCategory)?.value || 0).toLocaleString('en-IN')
                      : grandTotalScored.toLocaleString('en-IN')
                    }
                  </strong>
                  <span className="text-[10px] font-bold text-blue-600 block mt-0.5">
                    {hoveredCategory 
                      ? `${categoriesRollup.find(c => c.name === hoveredCategory)?.percentage}%`
                      : "Portfolio"
                    }
                  </span>
                </div>
              </div>

              {/* Legend with interactive highlight focus */}
              <div className="w-full space-y-1.5 text-xs">
                {categoriesRollup.map((cat, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredCategory(cat.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`flex items-center justify-between p-1.5 rounded-lg border transition-all cursor-pointer ${
                      hoveredCategory === cat.name 
                        ? 'bg-neutral-50 border-neutral-200 font-bold scale-[1.01]' 
                        : 'border-transparent text-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="truncate text-xs font-semibold">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold font-mono text-[11px] text-neutral-800">
                      <span>{cat.value.toLocaleString('en-IN')}</span>
                      <span className="text-neutral-300">|</span>
                      <span className="text-blue-600">{cat.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-2 bg-neutral-50 rounded-xl border border-dashed border-neutral-100">
              <ShieldAlert className="text-neutral-300" size={24} />
              <p className="text-xs text-neutral-400 font-semibold">No category data for the selected period.</p>
            </div>
          )}
        </div>

        {/* Recent Campaigns Table List (takes 2 columns) */}
        <div className="bg-white border border-neutral-200/60 rounded-xl p-5 shadow-sm space-y-4 lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-neutral-400 tracking-wider font-mono">Recent Activity Runs</h3>
              <button
                onClick={() => onNavigate('management')}
                className="text-[10.5px] font-bold text-[#1e40af] hover:text-[#1d4ed8] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View all campaigns</span>
                <ArrowRight size={12} />
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 font-medium">
              Click any recent batch to drill through and manage attributes, view error logs, or launch new uploads.
            </p>
          </div>

          <div className="flex-1 overflow-x-auto min-h-[300px]">
            {filteredCampaigns.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs mt-2">
                <thead>
                  <tr className="border-b border-neutral-100 text-[10.5px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50/50">
                    <th className="px-3.5 py-2.5">Campaign Name & offering</th>
                    <th className="px-3.5 py-2.5">Files Processed</th>
                    <th className="px-3.5 py-2.5 text-right">People Scored</th>
                    <th className="px-3.5 py-2.5">Uploaded By</th>
                    <th className="px-3.5 py-2.5">Status</th>
                    <th className="px-2 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredCampaigns.slice(0, 5).map((camp) => {
                    const statusInfo = getDisplayStatus(camp);
                    return (
                      <tr
                        key={camp.id}
                        onClick={() => onNavigate('management', camp.id)}
                        className="hover:bg-neutral-50/50 cursor-pointer transition-colors group"
                      >
                        <td className="px-3.5 py-3">
                          <div className="space-y-0.5">
                            <span className="font-bold text-neutral-800 group-hover:text-blue-600 transition-colors block leading-snug">
                              {camp.name}
                            </span>
                            <span className="text-[9.5px] font-mono text-neutral-400 font-bold uppercase block tracking-wider">
                              {camp.id} &bull; {camp.targetProduct}
                            </span>
                          </div>
                        </td>
                        <td className="px-3.5 py-3 text-neutral-500 font-semibold">
                          {camp.files?.length || 0} file(s)
                        </td>
                        <td className="px-3.5 py-3 text-right text-neutral-800 font-extrabold font-mono">
                          {camp.peopleScored.toLocaleString('en-IN')}
                        </td>
                        <td className="px-3.5 py-3 text-neutral-500 font-semibold">
                          {camp.uploadedBy}
                        </td>
                        <td className="px-3.5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase ${statusInfo.style}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-neutral-300 group-hover:text-neutral-500 transition-colors">
                          <ChevronRight size={14} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-2 bg-neutral-50 rounded-xl border border-dashed border-neutral-100">
                <Layers className="text-neutral-300" size={24} />
                <p className="text-xs text-neutral-400 font-semibold">No active campaign runs in this period.</p>
                <button
                  onClick={() => onNavigate('builder')}
                  className="mt-1 text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  Create a new campaign now
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
