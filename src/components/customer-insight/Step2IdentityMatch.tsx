import React, { useState } from 'react';
import { CustomerInsightRunData } from './types';
import { Download, Search } from 'lucide-react';

interface Step2IdentityMatchProps {
  data: CustomerInsightRunData;
  onBack: () => void;
  onNext: () => void;
  busy?: boolean;
}

export const Step2IdentityMatch: React.FC<Step2IdentityMatchProps> = ({
  data,
  onBack,
  onNext,
  busy = false,
}) => {
  const [activeTab, setActiveTab] = useState<'detailed' | 'registered' | 'breach' | 'timeline'>('detailed');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filteredRows = data.identityRows.filter((row) => {
    const matchesTab = activeTab === 'detailed'
      ? row.category === 'detailed'
      : activeTab === 'registered'
      ? row.category === 'registered'
      : true;
    const matchesSearch = row.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.keySignals.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const displayedRows = showAll ? filteredRows : filteredRows.slice(0, 6);

  const handleDownloadCsv = () => {
    const headers = ['Platform', 'Key Signals', 'Verified', 'Source', 'Category'];
    const csvContent = [
      headers.join(','),
      ...data.identityRows.map(r => 
        `"${r.platform}","${r.keySignals.join('; ')}","${r.verified ? 'Yes' : 'No'}","${r.source}","${r.category}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `race_identity_match_${data.subjectId.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-semibold mb-1">
            STEP 2 OF 6
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Identity match
          </h2>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Where this contact has a footprint, merged across both vendors.
          </p>
        </div>
        <div className="self-start sm:self-center px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-full text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
          <span>✓ Loaded from store · no vendor call</span>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
            {data.identityStats.modulesFound}
          </div>
          <div className="text-xs font-medium text-neutral-500 mt-1">
            Modules found
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
            {data.identityStats.detailedProfiles}
          </div>
          <div className="text-xs font-medium text-neutral-500 mt-1">
            Detailed profiles
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
            {data.identityStats.registeredOnly}
          </div>
          <div className="text-xs font-medium text-neutral-500 mt-1">
            Registered only
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
            {data.identityStats.breachRecords}
          </div>
          <div className="text-xs font-medium text-neutral-500 mt-1">
            Breach records
          </div>
        </div>
      </div>

      {/* Cost Card */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
        <div className="text-2xl font-bold tracking-tight text-neutral-900 tabular-nums">
          ₹{data.vendorSpendINR.toFixed(2)}
        </div>
        <div className="text-xs font-medium text-neutral-500 mt-0.5">
          Cost
        </div>
      </div>

      {/* What each vendor returned */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
          <h3 className="text-sm font-bold text-neutral-900">
            What each vendor returned
          </h3>
          <div className="flex items-center gap-4 text-xs font-medium text-neutral-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1e293b]" />
              <span>Detailed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]" />
              <span>Registered</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c2410c]" />
              <span>Breach</span>
            </span>
          </div>
        </div>

        {/* Stacked Bars */}
        <div className="space-y-4">
          {/* OSINT Industries */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-3 text-xs font-semibold text-neutral-800">
              OSINT Industries
            </div>
            <div className="sm:col-span-9 h-7 bg-neutral-100 rounded-lg overflow-hidden flex text-[11px] font-bold text-white leading-none">
              <div
                style={{ width: `${(16 / 47) * 100}%` }}
                className="bg-[#1e293b] flex items-center justify-center"
              >
                16
              </div>
              <div
                style={{ width: `${(19 / 47) * 100}%` }}
                className="bg-[#64748b] flex items-center justify-center border-l border-white/10"
              >
                19
              </div>
              <div
                style={{ width: `${(12 / 47) * 100}%` }}
                className="bg-[#c2410c] flex items-center justify-center border-l border-white/10"
              >
                12
              </div>
            </div>
          </div>

          {/* Behind the Email */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-3 text-xs font-semibold text-neutral-800">
              Behind the Email
            </div>
            <div className="sm:col-span-9 h-7 bg-neutral-100 rounded-lg overflow-hidden flex text-[11px] font-bold text-white leading-none">
              <div
                style={{ width: `${(6 / 47) * 100}%` }}
                className="bg-[#1e293b] flex items-center justify-center"
              >
                6
              </div>
              <div
                style={{ width: `${(4 / 47) * 100}%` }}
                className="bg-[#64748b] flex items-center justify-center border-l border-white/10"
              >
                4
              </div>
              <div
                style={{ width: `${(1 / 47) * 100}%` }}
                className="bg-[#c2410c] flex items-center justify-center border-l border-white/10"
              >
                1
              </div>
            </div>
          </div>
        </div>

        {/* Found by both */}
        <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-neutral-600">Found by both</span>
          {data.vendorBreakdown.foundByBoth.map((platform) => (
            <span
              key={platform}
              className="px-2.5 py-1 bg-neutral-100 border border-neutral-200/80 rounded-lg text-neutral-800 font-medium text-[11px]"
            >
              {platform}
            </span>
          ))}
          <span className="text-neutral-400 font-normal ml-2">
            Counted once after de-duplication
          </span>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-5">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100/90 rounded-xl border border-neutral-200/60 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('detailed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'detailed'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Detailed {data.identityStats.detailedProfiles}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('registered')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'registered'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Registered {data.identityStats.registeredOnly}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('breach')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'breach'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Breaches {data.identityStats.breachRecords}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Timeline 32
            </button>
          </div>

          {/* Search + CSV */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search platforms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3.5 py-1.5 text-xs font-medium text-neutral-800 bg-white border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#1e293b]/20"
              />
            </div>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-xl shadow-2xs hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="border border-neutral-200/70 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/80 border-b border-neutral-200/80 text-neutral-500 font-semibold">
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Key signals</th>
                <th className="py-3 px-4">Verified</th>
                <th className="py-3 px-4">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
              {displayedRows.map((row, idx) => (
                <tr key={`${row.platform}-${idx}`} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-neutral-900">
                    {row.platform}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {row.keySignals.map((signal, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 bg-neutral-100 border border-neutral-200/70 rounded-md text-[11px] text-neutral-700 font-medium"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        row.verified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {row.verified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-600">
                    {row.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
          <span>
            Showing {displayedRows.length} of {filteredRows.length} · Breach records show count and date only
          </span>
          {filteredRows.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="font-semibold text-[#1e293b] hover:underline cursor-pointer"
            >
              {showAll ? 'Show less' : 'Show all'}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={busy}
          className="px-6 py-2.5 text-xs font-semibold text-white bg-[#1e293b] hover:bg-[#0f172a] rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Build source plan · free
        </button>
      </div>
    </div>
  );
};
