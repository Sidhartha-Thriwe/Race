import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Share, Plus, Check } from 'lucide-react';
import { DashboardPeriod } from './AdminPanel';

interface AdminHeaderProps {
  selectedPeriod: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  onNewCampaign: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ selectedPeriod, onPeriodChange, onNewCampaign }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const periods: DashboardPeriod[] = ['This week', 'Last week', 'This month', 'Year to date'];

  // Handle clicking outside the dropdown to close it automatically
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 border-b border-neutral-200/50 select-none">
      {/* Title block */}
      <div>
        <p className="text-[10px] font-mono tracking-[0.25em] uppercase text-neutral-400 font-semibold">
          Lead Gen
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
          Dashboard
        </h2>
      </div>

      {/* Controls block */}
      <div className="flex flex-wrap items-center gap-3 relative">
        {/* Date Selector Dropdown wrapper */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200/80 rounded-lg shadow-sm transition-all cursor-pointer select-none active:scale-95"
          >
            <Calendar size={14} className="text-neutral-400" />
            <span className="text-neutral-800">{selectedPeriod}</span>
            <ChevronDown size={14} className={`text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Floating Dropdown Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-neutral-200/85 rounded-xl shadow-lg shadow-neutral-100/60 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1 text-[10px] font-mono tracking-wider uppercase text-neutral-400 font-semibold border-b border-neutral-100/60 pb-1.5 mb-1.5">
                Select timeframe
              </div>
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    onPeriodChange(p);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer ${
                    selectedPeriod === p 
                      ? 'bg-neutral-50 text-neutral-900 font-semibold' 
                      : 'text-neutral-600 hover:bg-neutral-50/60 hover:text-neutral-950'
                  }`}
                >
                  <span>{p}</span>
                  {selectedPeriod === p && <Check size={13} className="text-[#3b82f6] stroke-[3]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export / Share Button */}
        <button className="p-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200/80 rounded-lg shadow-sm transition-colors cursor-pointer" title="Export Dashboard Data">
          <Share size={14} className="text-neutral-500" />
        </button>

        {/* New Campaign Button */}
        <button 
          onClick={onNewCampaign}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#0b0c0e] hover:bg-neutral-800 text-white rounded-lg shadow-sm transition-all cursor-pointer hover:translate-y-[-1px] active:translate-y-0"
        >
          <Plus size={14} />
          <span>New Campaign</span>
        </button>
      </div>
    </header>
  );
};
