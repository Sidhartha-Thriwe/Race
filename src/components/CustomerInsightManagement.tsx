import React, { useState, useMemo } from 'react';
import { 
  Search, 
  PlusCircle, 
  FileText, 
  Users, 
  DollarSign, 
  ChevronRight, 
  Archive, 
  Copy, 
  HelpCircle, 
  SlidersHorizontal,
  ChevronLeft,
  X,
  Clock,
  Sparkles,
  Layers,
  Database,
  Trash2,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { QualCampaign, QualFile } from './LeadQualification';

interface CustomerInsightManagementProps {
  campaigns: QualCampaign[];
  onNewCampaign: () => void;
  onSelectCampaignForRun: (campaignId: string) => void;
  onCloneCampaign: (campaignId: string) => void;
  onArchiveCampaign: (campaignId: string) => void;
}

export const CustomerInsightManagement: React.FC<CustomerInsightManagementProps> = ({
  campaigns,
  onNewCampaign,
  onSelectCampaignForRun,
  onCloneCampaign,
  onArchiveCampaign
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUseCase, setSelectedUseCase] = useState<'All' | 'Engagement' | 'Retention' | 'General Insight'>('All');
  const [selectedDetailCampaign, setSelectedDetailCampaign] = useState<QualCampaign | null>(null);

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      if (c.isArchived) return false;
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (c.industry || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const campaignUseCase = c.useCaseTag || 'Engagement'; // fallback
      const matchesUseCase = selectedUseCase === 'All' || campaignUseCase === selectedUseCase;

      return matchesSearch && matchesUseCase;
    });
  }, [campaigns, searchQuery, selectedUseCase]);

  // Aggregate stats in real-time
  const stats = useMemo(() => {
    const activeCamps = campaigns.filter(c => !c.isArchived);
    const count = activeCamps.length;
    const totalFiles = activeCamps.reduce((acc, c) => acc + (c.files?.length || 0), 0);
    const totalPeople = activeCamps.reduce((acc, c) => acc + (c.peopleScored || 0), 0);
    const totalSpend = activeCamps.reduce((acc, c) => acc + (c.totalSpend || 0), 0);

    return { count, totalFiles, totalPeople, totalSpend };
  }, [campaigns]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in" id="insight-management-container">
      {/* Top action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Campaign Management — Customer Insight</h2>
          <p className="text-xs text-neutral-400 mt-0.5 font-medium">
            Monitor running campaigns, audit processed files, review cost estimations, and execute secondary cohort runs.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewCampaign}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 cursor-pointer shrink-0"
          id="mgmt_new_campaign_btn"
        >
          <PlusCircle size={15} />
          <span>New Insight Campaign</span>
        </button>
      </div>

      {/* Aggregate metrics tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="mgmt_stats_row">
        {/* Campaigns active */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4.5 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Active Campaigns</span>
            <h3 className="text-2xl font-black text-neutral-800">{stats.count}</h3>
            <span className="text-[9.5px] text-neutral-400 font-semibold block">Configured cohorts</span>
          </div>
          <div className="w-9 h-9 bg-neutral-50 rounded-lg flex items-center justify-center border border-neutral-100 text-neutral-600">
            <Layers size={16} />
          </div>
        </div>

        {/* Files Processed */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4.5 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Files Processed</span>
            <h3 className="text-2xl font-black text-neutral-800">{stats.totalFiles}</h3>
            <span className="text-[9.5px] text-neutral-400 font-semibold block">Rosters run in total</span>
          </div>
          <div className="w-9 h-9 bg-neutral-50 rounded-lg flex items-center justify-center border border-neutral-100 text-neutral-600">
            <FileText size={16} />
          </div>
        </div>

        {/* Grand Audience */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4.5 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Audience Scored</span>
            <h3 className="text-2xl font-black text-neutral-800">{stats.totalPeople.toLocaleString('en-IN')}</h3>
            <span className="text-[9.5px] text-neutral-400 font-semibold block">Total distinct individuals</span>
          </div>
          <div className="w-9 h-9 bg-neutral-50 rounded-lg flex items-center justify-center border border-neutral-100 text-neutral-600">
            <Users size={16} />
          </div>
        </div>

        {/* Cumulative spend */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4.5 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Running Spend Total</span>
            <h3 className="text-2xl font-black text-neutral-800">₹{stats.totalSpend.toLocaleString('en-IN')}</h3>
            <span className="text-[9.5px] text-neutral-400 font-semibold block">Grand system compute cost</span>
          </div>
          <div className="w-9 h-9 bg-neutral-50 rounded-lg flex items-center justify-center border border-neutral-100 text-neutral-600">
            <DollarSign size={16} />
          </div>
        </div>
      </div>

      {/* Filter and search controls */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Use-case segment bar */}
        <div className="flex bg-neutral-100 p-1 rounded-lg self-start">
          {(['All', 'Engagement', 'Retention', 'General Insight'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedUseCase(tab)}
              className={`py-1.5 px-4 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
                selectedUseCase === tab 
                  ? 'bg-white text-neutral-900 shadow-xs' 
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {tab === 'All' ? 'All Use Cases' : tab}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input 
            type="text"
            placeholder="Search by name, sector, campaign ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50 focus:bg-white border border-neutral-200 rounded-lg text-neutral-800 font-semibold placeholder-neutral-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Campaigns Listing Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-150 text-neutral-400 font-bold text-[10px] uppercase tracking-wider">
                <th className="px-5 py-3.5">Campaign Name & ID</th>
                <th className="px-5 py-3.5">Use-Case Tag</th>
                <th className="px-5 py-3.5">RACE Fit Context</th>
                <th className="px-5 py-3.5">Audience & Files</th>
                <th className="px-5 py-3.5">Spend Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredCampaigns.length > 0 ? (
                filteredCampaigns.map(c => {
                  const runningUseCase = c.useCaseTag || 'Engagement';
                  const budgetText = c.totalBudgetCap 
                    ? `₹${Number(c.totalBudgetCap).toLocaleString('en-IN')}` 
                    : 'Unlimited';
                  const isCapExceeded = !!c.totalBudgetCap && c.totalSpend >= c.totalBudgetCap;

                  return (
                    <tr key={c.id} className="hover:bg-neutral-50/40 transition-colors">
                      {/* Name & ID */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <strong className="text-neutral-900 font-extrabold text-xs block">{c.name}</strong>
                          <span className="text-[9.5px] text-neutral-400 font-mono block tracking-tight">{c.id}</span>
                        </div>
                      </td>

                      {/* Use-Case Tag */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 font-bold text-[9px] px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                          runningUseCase === 'Engagement' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          runningUseCase === 'Retention' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          'bg-neutral-50 text-neutral-600 border-neutral-200'
                        }`}>
                          {runningUseCase}
                        </span>
                      </td>

                      {/* RACE Fit attributes */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-neutral-600 font-semibold text-[11px]">
                            <span className="bg-neutral-100 text-neutral-600 text-[9.5px] px-1.5 py-0.5 rounded font-medium">
                              {c.industry || 'General'}
                            </span>
                          </div>
                          <span className="text-[9.5px] text-neutral-400 block font-medium">
                            {c.ticketSizeMin !== undefined ? (
                              <span>Ticket: ₹{c.ticketSizeMin >= 100000 ? `${(c.ticketSizeMin/100000).toFixed(0)}L` : c.ticketSizeMin.toLocaleString('en-IN')} - ₹{c.ticketSizeMax ? (c.ticketSizeMax >= 100000 ? `${(c.ticketSizeMax/100000).toFixed(0)}L` : c.ticketSizeMax.toLocaleString('en-IN')) : 'Any'} • {c.purchaseCycle || "One-time"}</span>
                            ) : (
                              <span>{c.customerSegment} • {c.capitalProfile}</span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Files & Audience */}
                      <td className="px-5 py-4 text-neutral-600">
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs block text-neutral-800">
                            {(c.peopleScored || 0).toLocaleString()} scored
                          </span>
                          <span className="text-[9.5px] text-neutral-400 block font-medium">
                            {c.files?.length || 0} roster file(s)
                          </span>
                        </div>
                      </td>

                      {/* Spend / Budget cap */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs text-neutral-800">
                              ₹{(c.totalSpend || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[9.5px] text-neutral-400 font-bold">
                            <span>Cap:</span>
                            <span className={isCapExceeded ? 'text-red-500 font-black' : 'text-neutral-500'}>
                              {budgetText}
                            </span>
                            {isCapExceeded && (
                              <span className="text-[8px] bg-red-50 text-red-700 border border-red-100 px-1 rounded uppercase tracking-wider">
                                Cap Met
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Interactive inline actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Details Drawer Trigger */}
                          <button
                            type="button"
                            onClick={() => setSelectedDetailCampaign(c)}
                            className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                            title="Audit File Logs"
                            id={`mgmt_details_${c.id}`}
                          >
                            <FileText size={14} />
                          </button>

                          {/* Clone */}
                          <button
                            type="button"
                            onClick={() => onCloneCampaign(c.id)}
                            className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Clone Campaign"
                            id={`mgmt_clone_${c.id}`}
                          >
                            <Copy size={14} />
                          </button>

                          {/* Add File / Run */}
                          <button
                            type="button"
                            onClick={() => onSelectCampaignForRun(c.id)}
                            disabled={isCapExceeded}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isCapExceeded 
                                ? 'text-neutral-300 cursor-not-allowed' 
                                : 'text-neutral-400 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                            title="Add File Run"
                            id={`mgmt_run_${c.id}`}
                          >
                            <PlusCircle size={14} />
                          </button>

                          {/* Archive / Delete */}
                          <button
                            type="button"
                            onClick={() => onArchiveCampaign(c.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete Campaign"
                            id={`mgmt_archive_${c.id}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-neutral-400 font-medium text-xs">
                    No Customer Insight campaigns found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Slide-out Drawer */}
      {selectedDetailCampaign && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" id="campaign_details_drawer">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setSelectedDetailCampaign(null)}
          />

          <div className="absolute inset-y-0 right-0 max-w-full pl-10 flex">
            <div className="w-screen max-w-md bg-white border-l border-neutral-200 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-blue-600 tracking-widest font-mono">Insight Campaign Audit Card</span>
                  <h3 className="text-base font-bold text-neutral-900 mt-1">{selectedDetailCampaign.name}</h3>
                  <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{selectedDetailCampaign.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDetailCampaign(null)}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-800 transition-colors cursor-pointer"
                  id="drawer_dismiss_btn"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Meta details */}
                <div className="space-y-3">
                  <h4 className="text-[10.5px] uppercase font-bold text-neutral-400 tracking-wider">Campaign Coordinates</h4>
                  <div className="bg-neutral-50 border border-neutral-150 rounded-xl p-4 space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] text-neutral-400 uppercase font-bold block">Use Case</span>
                        <strong className="text-neutral-800 font-bold block mt-0.5">{selectedDetailCampaign.useCaseTag || 'Engagement'}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-400 uppercase font-bold block">Sector Focus</span>
                        <strong className="text-neutral-800 font-bold block mt-0.5">{selectedDetailCampaign.industry || 'General'}</strong>
                      </div>
                    </div>

                    <div className="border-t border-neutral-200/60 pt-3 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] text-neutral-400 uppercase font-bold block">Ticket Size Range</span>
                        <strong className="text-neutral-800 font-bold block mt-0.5 truncate">
                          {selectedDetailCampaign.ticketSizeMin !== undefined 
                            ? `₹${selectedDetailCampaign.ticketSizeMin.toLocaleString('en-IN')} - ₹${selectedDetailCampaign.ticketSizeMax ? selectedDetailCampaign.ticketSizeMax.toLocaleString('en-IN') : 'Any'}`
                            : selectedDetailCampaign.capitalProfile || 'Any'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-400 uppercase font-bold block">Purchase Cycle & Channel</span>
                        <strong className="text-neutral-800 font-bold block mt-0.5">
                          {selectedDetailCampaign.purchaseCycle || selectedDetailCampaign.customerSegment || 'One-time'} 
                          {selectedDetailCampaign.purchaseChannel ? ` (${selectedDetailCampaign.purchaseChannel})` : ''}
                        </strong>
                      </div>
                    </div>

                    <div className="border-t border-neutral-200/60 pt-3 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] text-neutral-400 uppercase font-bold block">Grand Spend</span>
                        <strong className="text-neutral-800 font-bold block mt-0.5">₹{(selectedDetailCampaign.totalSpend || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-400 uppercase font-bold block">Budget Cap</span>
                        <strong className="text-neutral-800 font-bold block mt-0.5">
                          {selectedDetailCampaign.totalBudgetCap ? `₹${Number(selectedDetailCampaign.totalBudgetCap).toLocaleString('en-IN')}` : 'Unlimited'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scored files history logs */}
                <div className="space-y-3">
                  <h4 className="text-[10.5px] uppercase font-bold text-neutral-400 tracking-wider">Scored Files History</h4>
                  <div className="space-y-3">
                    {selectedDetailCampaign.files && selectedDetailCampaign.files.length > 0 ? (
                      selectedDetailCampaign.files.map(file => (
                        <div key={file.id} className="bg-neutral-50 border border-neutral-150 p-4 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between border-b border-neutral-200/60 pb-1.5 text-xs">
                            <span className="font-bold text-neutral-800 flex items-center gap-1">
                              <FileText size={12} className="text-neutral-400" />
                              {file.fileName}
                            </span>
                            <span className="text-[9.5px] font-mono text-neutral-400">{file.dateUploaded}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                            <div className="p-1.5 bg-white border border-neutral-150 rounded shadow-xs">
                              <span className="text-[8px] uppercase font-bold text-neutral-400 block">Accepted</span>
                              <strong className="text-neutral-800 font-extrabold">{file.rowsAccepted.toLocaleString()}</strong>
                            </div>
                            <div className="p-1.5 bg-white border border-neutral-150 rounded shadow-xs">
                              <span className="text-[8px] uppercase font-bold text-amber-600 block">Skipped</span>
                              <strong className="text-amber-700 font-extrabold">{file.rowsSkipped.toLocaleString()}</strong>
                            </div>
                            <div className="p-1.5 bg-white border border-neutral-150 rounded shadow-xs">
                              <span className="text-[8px] uppercase font-bold text-emerald-600 block">Cost</span>
                              <strong className="text-emerald-800 font-extrabold">₹{file.cost.toLocaleString('en-IN')}</strong>
                            </div>
                          </div>

                          {/* Skip Reasons inside drawer */}
                          {file.skipReasons && file.skipReasons.length > 0 && (
                            <div className="bg-white border border-neutral-200/50 rounded-lg p-2.5 space-y-1">
                              <span className="text-[8.5px] font-black text-neutral-400 uppercase tracking-wider block">Exclusions / Skips Audit:</span>
                              <div className="space-y-1 divide-y divide-neutral-100">
                                {file.skipReasons.map((sr, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-[10px] text-neutral-500 font-semibold pt-1 first:pt-0">
                                    <span className="truncate max-w-[180px]">{sr.reason}</span>
                                    <span className="font-mono text-[9px] text-neutral-400">{sr.count} rows</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-neutral-400 font-medium text-xs">
                        No files run inside this campaign.
                      </div>
                    )}
                  </div>
                </div>

                {/* Audit Activity history trail */}
                {selectedDetailCampaign.activityLog && selectedDetailCampaign.activityLog.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10.5px] uppercase font-bold text-neutral-400 tracking-wider">System Activity Logs</h4>
                    <div className="bg-neutral-900 text-emerald-400 font-mono text-[10px] p-4 rounded-xl max-h-40 overflow-y-auto space-y-1.5 shadow-inner border border-neutral-800 select-text">
                      {selectedDetailCampaign.activityLog.map((log, index) => (
                        <div key={index} className="leading-relaxed opacity-90">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Drawer Footer */}
              <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDetailCampaign(null)}
                  className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-xs text-neutral-600 font-bold transition-all text-center cursor-pointer"
                >
                  Dismiss Detail Card
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
