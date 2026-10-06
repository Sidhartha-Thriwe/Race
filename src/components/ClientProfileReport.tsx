import React, { useState } from 'react';
import {
  ArrowLeft,
  Share2,
  Printer,
  RotateCcw,
  Star,
  ExternalLink,
  Zap,
  Video,
  Search,
  Check,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Globe,
  Sliders,
  Sparkles
} from 'lucide-react';
import { OnboardedClient } from './ClientOnboarding';

interface ClientProfileReportProps {
  client?: OnboardedClient | null;
  onBack: () => void;
  onNewClient: () => void;
}

export const ClientProfileReport: React.FC<ClientProfileReportProps> = ({
  client,
  onBack,
  onNewClient,
}) => {
  const [copied, setCopied] = useState(false);
  const [cacModalOpen, setCacModalOpen] = useState(false);
  const [targetCac, setTargetCac] = useState<string>('₹4,500');

  // Client display metadata with defaults matching the reference screenshot
  const clientName = client?.clientName?.trim() || 'Aurelia Watches';
  const website = client?.digitalPresence?.website || 'aureliawatches.example';
  const industry = client?.industry || 'Luxury Watches';
  const purchaseChannel = client?.purchaseChannel || 'Retail and D2C';
  
  // Format competitor names
  const comp1 = client?.digitalPresence?.competitorWebsites?.[0] || 'Competitor A';
  const comp2 = client?.digitalPresence?.competitorWebsites?.[1] || 'Competitor B';
  const comp3 = client?.digitalPresence?.competitorWebsites?.[2] || 'Competitor C';

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper for Radar Chart SVG vertices (6 axes)
  // Axes: 0: Website (top), 1: Social, 2: Content, 3: Trust, 4: Engagement, 5: Pricing clarity
  const center = 150;
  const maxR = 100;
  const getCoordinates = (value: number, axisIndex: number, maxValue = 10) => {
    const angle = (Math.PI * 2 / 6) * axisIndex - Math.PI / 2;
    const r = (value / maxValue) * maxR;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Radar points
  // Values: Website, Social, Content, Trust, Engagement, Pricing clarity
  const aureliaScores = [7.3, 5.9, 7.5, 8.1, 5.6, 6.8];
  const compScores = [6.6, 7.4, 6.2, 7.2, 6.9, 6.0];

  const aureliaPolygon = aureliaScores
    .map((v, i) => {
      const { x, y } = getCoordinates(v, i);
      return `${x},${y}`;
    })
    .join(' ');

  const compPolygon = compScores
    .map((v, i) => {
      const { x, y } = getCoordinates(v, i);
      return `${x},${y}`;
    })
    .join(' ');

  const radarAxes = [
    { label: 'Website', x: 150, y: 32, anchor: 'middle' },
    { label: 'Social', x: 260, y: 92, anchor: 'start' },
    { label: 'Content', x: 260, y: 215, anchor: 'start' },
    { label: 'Trust', x: 150, y: 275, anchor: 'middle' },
    { label: 'Engagement', x: 40, y: 215, anchor: 'end' },
    { label: 'Pricing clarity', x: 40, y: 92, anchor: 'end' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 font-sans text-neutral-900 print:p-0 print:m-0 print:max-w-none">
      
      {/* Top Action Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-neutral-200/90 rounded-2xl p-4 sm:px-6 shadow-2xs print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Onboarded Clients</span>
          </button>
          <span className="text-neutral-300">/</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-neutral-900">{clientName}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563eb] border border-blue-100">
              Intelligence Report
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
            <span>{copied ? 'Link Copied' : 'Share'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            <Printer size={13} />
            <span>Print Report</span>
          </button>
          <button
            onClick={onNewClient}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Onboard Another</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          1. HEADER / IDENTITY CARD & DIGITAL PRESENCE SCORE
         ======================================================== */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Brand Identity & Assigned Persona (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {/* Monogram Box */}
                <div className="w-14 h-14 rounded-2xl bg-[#1b253b] text-white flex items-center justify-center font-serif text-2xl font-normal shadow-sm shrink-0">
                  {clientName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-neutral-900 font-normal">
                    {clientName}
                  </h1>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5 flex items-center gap-1.5">
                    <span>{website}</span>
                    <span>·</span>
                    <span className="text-neutral-400">Onboarded client profile</span>
                  </p>
                </div>
              </div>

              {/* Tags Row */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-md font-medium">
                  {industry}
                </span>
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-md font-medium">
                  {purchaseChannel}
                </span>
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-md font-medium">
                  Mass affluent to HNI
                </span>
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-md font-medium">
                  India
                </span>
              </div>
            </div>

            {/* Assigned Persona Strip */}
            <div className="p-4 bg-neutral-50/80 border border-neutral-200/80 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 text-neutral-700 flex items-center justify-center shadow-2xs">
                  <Star size={15} className="text-amber-500 fill-amber-500/20" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Assigned Persona
                  </span>
                  <span className="text-sm font-bold text-neutral-900">
                    The Heritage Craft Brand
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-medium text-neutral-500 border border-neutral-200 bg-white px-2.5 py-0.5 rounded-full">
                Inferred
              </span>
            </div>
          </div>

          {/* Right Column: Digital Presence Score Card (5 cols) */}
          <div className="lg:col-span-5 bg-[#1b253b] text-white rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
              <span>Digital Presence Score</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Center Circular Score */}
            <div className="flex items-center justify-center py-5">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-neutral-700/60"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-white"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - 0.66)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black tracking-tight text-white font-mono">
                    6.6
                  </span>
                  <span className="text-[11px] text-neutral-400 font-medium -mt-0.5">
                    out of 10
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Split Scores */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-700/60 text-center">
              <div className="border-r border-neutral-700/60 pr-2">
                <span className="text-xl font-bold font-mono text-white block">7.3</span>
                <span className="text-xs text-neutral-400 font-medium">Website</span>
              </div>
              <div className="pl-2">
                <span className="text-xl font-bold font-mono text-white block">5.9</span>
                <span className="text-xs text-neutral-400 font-medium">Social</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================
          2. SCORECARDS: WEBSITE & SOCIAL (2 Columns)
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* WEBSITE Scorecard */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-2xs space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Website
                </span>
                <h3 className="text-lg font-bold text-neutral-900 mt-0.5">
                  Scorecard
                </h3>
              </div>
              <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md">
                From public sources
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center mt-6">
              {/* Donut Gauge */}
              <div className="sm:col-span-4 flex flex-col items-center justify-center">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-neutral-100"
                      strokeWidth="9"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-[#1b253b]"
                      strokeWidth="9"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - 0.73)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black font-mono text-neutral-900">7.3</span>
                    <span className="text-[10px] text-neutral-400 font-medium">of 10</span>
                  </div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="sm:col-span-8 space-y-2.5 text-xs">
                {[
                  { label: 'Structure', score: '8.2', pct: 82, attention: false },
                  { label: 'Content', score: '7.0', pct: 70, attention: false },
                  { label: 'Trust', score: '8.1', pct: 81, attention: false },
                  { label: 'Mobile', score: '7.6', pct: 76, attention: false },
                  { label: 'SEO', score: '6.7', pct: 67, attention: true },
                  { label: 'Speed', score: '6.4', pct: 64, attention: true },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-16 text-neutral-600 font-medium truncate">{item.label}</span>
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.attention ? 'bg-[#c2612a]' : 'bg-[#1b253b]'}`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                    <span className="w-7 text-right font-mono font-bold text-neutral-900">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-neutral-100 text-xs text-neutral-500">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#c2612a]" />
            <span>Needs attention</span>
          </div>
        </div>

        {/* SOCIAL Handle Scorecard */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-2xs space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Social
                </span>
                <h3 className="text-lg font-bold text-neutral-900 mt-0.5">
                  Handle scorecard
                </h3>
              </div>
              <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md">
                From public sources
              </span>
            </div>

            {/* Channels List */}
            <div className="space-y-3 mt-6">
              {[
                { channel: 'IG', name: 'Instagram', score: '7.1', pct: 71, followers: '24.8k', eng: '3.2%' },
                { channel: 'in', name: 'LinkedIn', score: '5.8', pct: 58, followers: '6.1k', eng: '1.4%' },
                { channel: 'YT', name: 'YouTube', score: '4.9', pct: 49, followers: '2.3k', eng: '1.1%', attention: true },
              ].map((row, idx) => (
                <div key={idx} className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-neutral-200 font-mono font-bold text-[10px] text-neutral-700 flex items-center justify-center">
                        {row.channel}
                      </span>
                      <span className="font-bold text-neutral-900">{row.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-neutral-500">
                      <span><strong className="font-mono text-neutral-900">{row.followers}</strong> followers</span>
                      <span><strong className="font-mono text-neutral-900">{row.eng}</strong> engagement</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-neutral-200/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${row.attention ? 'bg-[#c2612a]' : 'bg-[#1b253b]'}`}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-xs text-neutral-900">{row.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Mix Donut + Legend */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4">
              {/* Mini Donut chart */}
              <div className="relative w-12 h-12 shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                  {/* Segment 1: Product 46% (navy) */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#1b253b" strokeWidth="6" strokeDasharray="46 100" strokeDashoffset="0" />
                  {/* Segment 2: Lifestyle 24% (slate) */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#546e7a" strokeWidth="6" strokeDasharray="24 100" strokeDashoffset="-46" />
                  {/* Segment 3: Video 18% (light blue) */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#8fa8b8" strokeWidth="6" strokeDasharray="18 100" strokeDashoffset="-70" />
                  {/* Segment 4: Offers 12% (gray) */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#cbd5e1" strokeWidth="6" strokeDasharray="12 100" strokeDashoffset="-88" />
                </svg>
              </div>

              {/* Legend grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-neutral-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-[#1b253b]" />
                  <span>Product 46%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-[#546e7a]" />
                  <span>Lifestyle 24%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-[#8fa8b8]" />
                  <span>Video 18%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-[#cbd5e1]" />
                  <span>Offers 12%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================
          3. SEARCH VISIBILITY / SEO SCORECARD (Full Width)
         ======================================================== */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Search Visibility
            </span>
            <h2 className="text-xl font-bold text-neutral-900 mt-0.5">
              SEO scorecard
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md">
              Site checks from public sources
            </span>
            <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md border border-dashed border-neutral-300">
              Traffic and links estimated
            </span>
          </div>
        </div>

        {/* Top Metrics Row: Score circle + 4 Stat boxes + Score by area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Donut Score (2 cols) */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="text-neutral-100"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="text-[#1b253b]"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - 0.67)}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black font-mono text-neutral-900">6.7</span>
                <span className="text-[10px] text-neutral-400 font-medium">of 10</span>
              </div>
            </div>
          </div>

          {/* 4 Stat Boxes (4 cols) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 space-y-1">
              <span className="text-xl font-bold font-mono text-neutral-900 block">1,240</span>
              <span className="text-neutral-500 font-medium text-[11px]">Indexed pages</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 space-y-1">
              <span className="text-xl font-bold font-mono text-neutral-900 block">3,860</span>
              <span className="text-neutral-500 font-medium text-[11px]">Ranking keywords</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 space-y-1">
              <span className="text-xl font-bold font-mono text-neutral-900 block">214</span>
              <span className="text-neutral-500 font-medium text-[11px]">Top-10 keywords</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 space-y-1">
              <span className="text-xl font-bold font-mono text-neutral-900 block">142</span>
              <span className="text-neutral-500 font-medium text-[11px]">Linking sites, low</span>
            </div>
          </div>

          {/* Score By Area Comparison (6 cols) */}
          <div className="lg:col-span-6 space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-1 text-[11px] text-neutral-500 font-medium">
              <span className="font-bold text-neutral-800">Score by area</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-neutral-800 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#1b253b]" /> {clientName.split(' ')[0]}
                </span>
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <span className="w-3 border-t border-dashed border-neutral-400" /> Competitor avg
                </span>
              </div>
            </div>

            {[
              { area: 'Technical', you: '6.8', comp: '7.0', pct: 68, attention: false },
              { area: 'On-page', you: '7.2', comp: '6.5', pct: 72, attention: false },
              { area: 'Content', you: '6.9', comp: '6.2', pct: 69, attention: false },
              { area: 'Backlinks', you: '5.4', comp: '7.1', pct: 54, attention: true },
              { area: 'Brand search', you: '7.4', comp: '6.8', pct: 74, attention: false },
            ].map((row, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-24 text-neutral-600 font-medium">{row.area}</span>
                <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full ${row.attention ? 'bg-[#c2612a]' : 'bg-[#1b253b]'}`}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
                <span className="w-14 text-right font-mono text-neutral-500">
                  <strong className={row.attention ? 'text-[#c2612a]' : 'text-neutral-900'}>{row.you}</strong> / {row.comp}
                </span>
              </div>
            ))}
          </div>

        </div>

        {/* Middle Section: Site Health + 12 Weeks Trend Line + Core Web Vitals */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-neutral-100">
          
          {/* Left: Site Health & Core Web Vitals (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-900">Site health</span>
                <span className="text-[11px] text-neutral-400 font-mono">1,240 pages checked</span>
              </div>

              {/* Segmented bar */}
              <div className="h-3 w-full rounded-md overflow-hidden flex bg-neutral-100">
                <div className="h-full bg-[#1b253b]" style={{ width: '78%' }} />
                <div className="h-full bg-[#546e7a]" style={{ width: '15%' }} />
                <div className="h-full bg-[#c2612a]" style={{ width: '7%' }} />
              </div>

              <div className="flex items-center gap-4 text-[11px] text-neutral-600 pt-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-xs bg-[#1b253b]" /> Healthy 78%
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-xs bg-[#546e7a]" /> Warnings 15%
                </span>
                <span className="flex items-center gap-1.5 font-medium text-[#c2612a]">
                  <span className="w-2 h-2 rounded-xs bg-[#c2612a]" /> Errors 7%
                </span>
              </div>
            </div>

            {/* Core Web Vitals */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-neutral-900 block">Core Web Vitals</span>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                  <span className="text-[11px] text-neutral-500 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Load (LCP)
                  </span>
                  <span className="text-base font-bold font-mono text-neutral-900 mt-1 block">3.1s</span>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                  <span className="text-[11px] text-neutral-500 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Stability (CLS)
                  </span>
                  <span className="text-base font-bold font-mono text-neutral-900 mt-1 block">0.04</span>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                  <span className="text-[11px] text-neutral-500 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Response (INP)
                  </span>
                  <span className="text-base font-bold font-mono text-neutral-900 mt-1 block">210ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Search Visibility Last 12 Weeks (6 cols) */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-900">Search visibility, last 12 weeks</span>
              <span className="text-[11px] font-semibold text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded">
                Gap 17 to 5 points
              </span>
            </div>

            {/* SVG Line Chart */}
            <div className="bg-neutral-50 rounded-xl border border-neutral-100 p-4">
              <div className="h-32 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 380 100" preserveAspectRatio="none">
                  {/* Subtle Grid Lines */}
                  <line x1="0" y1="20" x2="380" y2="20" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="380" y2="50" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="80" x2="380" y2="80" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Competitor Avg Dashed Line (steady ~35) */}
                  <path
                    d="M 10 32 Q 90 28, 190 30 T 370 25"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <circle cx="370" cy="25" r="3.5" fill="#94a3b8" />

                  {/* Aurelia Rising Solid Line (from 78 to 32) */}
                  <path
                    d="M 10 75 Q 90 70, 190 55 T 370 30"
                    fill="none"
                    stroke="#1b253b"
                    strokeWidth="2.5"
                  />
                  <circle cx="10" cy="75" r="3.5" fill="#1b253b" />
                  <circle cx="370" cy="30" r="4" fill="#1b253b" stroke="#ffffff" strokeWidth="1.5" />
                </svg>
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono mt-2 pt-2 border-t border-neutral-200/60">
                <span>Week 1</span>
                <span>Week 12</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Section: SEO Quick Wins */}
        <div className="space-y-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-900">SEO quick wins</span>
            <div className="flex items-center gap-3 text-[11px] text-neutral-500">
              <span className="flex items-center gap-1 font-semibold text-neutral-700">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" /> Impact
              </span>
              <span className="flex items-center gap-1 font-semibold text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full border border-neutral-400 bg-white" /> Effort
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {[
              {
                title: 'Compress product images',
                lift: '+0.5',
                impact: 3,
                effort: 1,
              },
              {
                title: 'Add product schema markup',
                lift: '+0.3',
                impact: 2,
                effort: 3,
              },
              {
                title: 'Publish gifting guides',
                lift: '+0.4',
                impact: 2,
                effort: 3,
              },
              {
                title: 'Earn links from watch publications',
                lift: '+0.8',
                impact: 3,
                effort: 3,
              },
            ].map((win, idx) => (
              <div key={idx} className="p-4 bg-neutral-50/80 rounded-xl border border-neutral-100 flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-neutral-900 leading-tight">{win.title}</span>
                  <span className="font-mono font-bold text-xs text-neutral-700 bg-white px-2 py-0.5 rounded border border-neutral-200 shrink-0">
                    {win.lift}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-200/50">
                  <div className="flex items-center gap-1">
                    <span>Impact</span>
                    <span className="flex items-center gap-0.5 ml-1">
                      {[1, 2, 3].map(dot => (
                        <span
                          key={dot}
                          className={`w-1.5 h-1.5 rounded-full ${dot <= win.impact ? 'bg-neutral-800' : 'bg-neutral-300'}`}
                        />
                      ))}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Effort</span>
                    <span className="flex items-center gap-0.5 ml-1">
                      {[1, 2, 3].map(dot => (
                        <span
                          key={dot}
                          className={`w-1.5 h-1.5 rounded-full border border-neutral-400 ${dot <= win.effort ? 'bg-neutral-400' : 'bg-white'}`}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-neutral-400 italic">
            Figures beside each win are the estimated lift to the SEO score.
          </p>
        </div>

      </div>

      {/* ========================================================
          4. COMPETITIVE BENCHMARK (Radar Chart & Competitor Matrix)
         ======================================================== */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Competitive Benchmark
            </span>
            <h2 className="text-xl font-bold text-neutral-900 mt-0.5">
              You against three competitors
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md">
              From public sources
            </span>
            <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md border border-dashed border-neutral-300">
              Share of voice inferred
            </span>
          </div>
        </div>

        {/* 3-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
          
          {/* Column 1: Radar Chart (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="relative w-72 h-72">
              <svg className="w-full h-full" viewBox="0 0 300 300">
                {/* Concentric Hexagon Rings */}
                {[20, 40, 60, 80, 100].map((r, ringIdx) => {
                  const points = [0, 1, 2, 3, 4, 5]
                    .map(i => {
                      const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
                      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                    })
                    .join(' ');
                  return (
                    <polygon
                      key={ringIdx}
                      points={points}
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Axes Spokes */}
                {[0, 1, 2, 3, 4, 5].map(i => {
                  const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
                  return (
                    <line
                      key={i}
                      x1={center}
                      y1={center}
                      x2={center + maxR * Math.cos(angle)}
                      y2={center + maxR * Math.sin(angle)}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Competitor Average Polygon (Dashed gray) */}
                <polygon
                  points={compPolygon}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.8"
                  strokeDasharray="4 3"
                />

                {/* Aurelia Polygon (Filled subtle blue, dark navy outline) */}
                <polygon
                  points={aureliaPolygon}
                  fill="#1b253b"
                  fillOpacity="0.12"
                  stroke="#1b253b"
                  strokeWidth="2.2"
                />

                {/* Vertex Dots */}
                {aureliaScores.map((v, i) => {
                  const { x, y } = getCoordinates(v, i);
                  return <circle key={i} cx={x} cy={y} r="3.5" fill="#1b253b" />;
                })}

                {/* Axis Labels */}
                {radarAxes.map((axis, i) => (
                  <text
                    key={i}
                    x={axis.x}
                    y={axis.y}
                    textAnchor={axis.anchor as any}
                    fontSize="11"
                    fontWeight="500"
                    fill="#475569"
                    className="font-sans"
                  >
                    {axis.label}
                  </text>
                ))}
              </svg>
            </div>

            {/* Radar Legend */}
            <div className="flex items-center gap-4 text-xs mt-2">
              <span className="flex items-center gap-1.5 font-semibold text-neutral-900">
                <span className="w-3.5 h-0.5 bg-neutral-900" /> {clientName.split(' ')[0]}
              </span>
              <span className="flex items-center gap-1.5 font-medium text-neutral-500">
                <span className="w-3.5 border-t border-dashed border-neutral-400" /> Competitor average
              </span>
            </div>
          </div>

          {/* Column 2: Share of Voice & Price Positioning (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Share of voice */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-900 block">Share of voice</span>
              
              {/* Segmented Bar */}
              <div className="h-6 w-full rounded-lg overflow-hidden flex text-white font-mono font-bold text-[11px]">
                <div className="h-full bg-[#1b253b] flex items-center justify-center" style={{ width: '31%' }}>
                  31%
                </div>
                <div className="h-full bg-[#546e7a] flex items-center justify-center" style={{ width: '29%' }}>
                  29%
                </div>
                <div className="h-full bg-[#8fa8b8] flex items-center justify-center text-neutral-800" style={{ width: '24%' }}>
                  24%
                </div>
                <div className="h-full bg-[#cbd5e1] flex items-center justify-center text-neutral-700" style={{ width: '16%' }}>
                  16%
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
                <span className="font-semibold text-neutral-900">{clientName.split(' ')[0]}</span>
                <span>{comp1.replace(/^https?:\/\//, '').split('.')[0] || 'Competitor A'}</span>
                <span>{comp2.replace(/^https?:\/\//, '').split('.')[0] || 'Competitor B'}</span>
                <span>{comp3.replace(/^https?:\/\//, '').split('.')[0] || 'Competitor C'}</span>
              </div>
            </div>

            {/* Price positioning */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-neutral-900 block">Price positioning</span>

              <div className="relative pt-6 pb-2">
                {/* Horizontal Scale Line */}
                <div className="h-1 bg-neutral-200 rounded-full w-full" />

                {/* Nodes on Axis */}
                {/* Node A (Accessible / Premium) */}
                <div className="absolute top-1 left-[32%] -translate-x-1/2 flex flex-col items-center">
                  <span className="text-[10px] font-mono text-neutral-500 mb-1">A</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
                </div>

                {/* Node You (Premium) */}
                <div className="absolute top-0 left-[62%] -translate-x-1/2 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-neutral-900 mb-1">You</span>
                  <span className="w-4 h-4 rounded-full bg-[#1b253b] border-2 border-white shadow-xs" />
                </div>

                {/* Node B (Luxury) */}
                <div className="absolute top-1 left-[78%] -translate-x-1/2 flex flex-col items-center">
                  <span className="text-[10px] font-mono text-neutral-500 mb-1">B</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
                </div>

                {/* Node C (Luxury end) */}
                <div className="absolute top-1 left-[92%] -translate-x-1/2 flex flex-col items-center">
                  <span className="text-[10px] font-mono text-neutral-500 mb-1">C</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium">
                <span>Accessible</span>
                <span>Premium</span>
                <span>Luxury</span>
              </div>
            </div>

          </div>

          {/* Column 3: Where You Stand (4 cols) */}
          <div className="lg:col-span-4 space-y-2.5">
            <span className="text-xs font-bold text-neutral-900 block pb-1">Where you stand</span>

            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-0.5">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Check size={14} className="text-emerald-600" /> Ahead on trust
              </span>
              <span className="text-[11px] text-emerald-700 block font-mono pl-5">
                8.1 against 7.2 average
              </span>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-0.5">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Check size={14} className="text-emerald-600" /> Ahead on website
              </span>
              <span className="text-[11px] text-emerald-700 block font-mono pl-5">
                7.3 against 6.6 average
              </span>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl space-y-0.5">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-600" /> Behind on social
              </span>
              <span className="text-[11px] text-amber-700 block font-mono pl-5">
                5.9 against 7.4 average
              </span>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl space-y-0.5">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-600" /> Behind on engagement
              </span>
              <span className="text-[11px] text-amber-700 block font-mono pl-5">
                5.6 against 6.9 average
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================
          5. CUSTOMER INSIGHT: WHO IS LIKELY BUYING
         ======================================================== */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Customer Insight
            </span>
            <h2 className="text-xl font-bold text-neutral-900 mt-0.5">
              Who is likely buying
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md">
              Inferred from public signals
            </span>
            <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md border border-dashed border-neutral-300">
              Confirm with client data
            </span>
          </div>
        </div>

        {/* 3 Buyer Persona Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Persona 1 */}
          <div className="p-5 bg-neutral-50/90 rounded-2xl border border-neutral-100 space-y-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black font-mono text-neutral-900">38%</span>
              <span className="text-xs text-neutral-500 font-medium">of likely buyers</span>
            </div>
            <h4 className="text-sm font-bold text-neutral-900">Heritage collectors</h4>
            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
              <span className="px-2.5 py-1 bg-white border border-neutral-200/80 rounded-md text-neutral-600 font-medium">
                35 to 55
              </span>
              <span className="px-2.5 py-1 bg-white border border-neutral-200/80 rounded-md text-neutral-600 font-medium">
                Metro
              </span>
              <span className="px-2.5 py-1 bg-white border border-neutral-200/80 rounded-md text-neutral-600 font-medium">
                Craft and provenance
              </span>
            </div>
          </div>

          {/* Persona 2 */}
          <div className="p-5 bg-neutral-50/90 rounded-2xl border border-neutral-100 space-y-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black font-mono text-neutral-900">34%</span>
              <span className="text-xs text-neutral-500 font-medium">of likely buyers</span>
            </div>
            <h4 className="text-sm font-bold text-neutral-900">Milestone gifters</h4>
            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
              <span className="px-2.5 py-1 bg-white border border-neutral-200/80 rounded-md text-neutral-600 font-medium">
                28 to 45
              </span>
              <span className="px-2.5 py-1 bg-white border border-neutral-200/80 rounded-md text-neutral-600 font-medium">
                Festive peaks
              </span>
              <span className="px-2.5 py-1 bg-white border border-neutral-200/80 rounded-md text-neutral-600 font-medium">
                Gifting
              </span>
            </div>
          </div>

          {/* Persona 3 */}
          <div className="p-5 bg-neutral-50/90 rounded-2xl border border-neutral-100 space-y-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black font-mono text-neutral-900">28%</span>
              <span className="text-xs text-neutral-500 font-medium">of likely buyers</span>
            </div>
            <h4 className="text-sm font-bold text-neutral-900">First-luxury buyers</h4>
            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
              <span className="px-2.5 py-1 bg-white border border-neutral-200/80 rounded-md text-neutral-600 font-medium">
                25 to 34
              </span>
              <span className="px-2.5 py-1 bg-white border border-neutral-200/80 rounded-md text-neutral-600 font-medium">
                Social-led
              </span>
              <span className="px-2.5 py-1 bg-white border border-neutral-200/80 rounded-md text-neutral-600 font-medium">
                Aspirational
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Strip: Sentiment & What people talk about */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-neutral-100 items-center">
          
          {/* Sentiment (6 cols) */}
          <div className="lg:col-span-6 space-y-2">
            <span className="text-xs font-bold text-neutral-900 block">Public sentiment</span>
            
            <div className="h-3 w-full rounded-md overflow-hidden flex bg-neutral-100">
              <div className="h-full bg-[#1b253b]" style={{ width: '68%' }} />
              <div className="h-full bg-[#546e7a]" style={{ width: '24%' }} />
              <div className="h-full bg-[#c2612a]" style={{ width: '8%' }} />
            </div>

            <div className="flex items-center gap-4 text-[11px] text-neutral-600 pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-xs bg-[#1b253b]" /> Positive 68%
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-xs bg-[#546e7a]" /> Neutral 24%
              </span>
              <span className="flex items-center gap-1.5 font-medium text-[#c2612a]">
                <span className="w-2 h-2 rounded-xs bg-[#c2612a]" /> Negative 8%
              </span>
            </div>
          </div>

          {/* What people talk about (6 cols) */}
          <div className="lg:col-span-6 space-y-2">
            <span className="text-xs font-bold text-neutral-900 block">What people talk about</span>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-md font-medium">
                Craftsmanship
              </span>
              <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-md font-medium">
                Design
              </span>
              <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-md font-medium">
                Gifting
              </span>
              <span className="px-3 py-1 bg-amber-50 text-[#c2612a] border border-amber-200/80 rounded-md font-medium">
                Delivery wait
              </span>
              <span className="px-3 py-1 bg-amber-50 text-[#c2612a] border border-amber-200/80 rounded-md font-medium">
                Price
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================
          6. QUICK WINS & SUGGESTED FIRST CAMPAIGN (2 Columns)
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: Quick Wins: Where to start (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-5 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Quick Wins
            </span>
            <h3 className="text-lg font-bold text-neutral-900 mt-0.5">
              Where to start
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              
              {/* Win 1 */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-900">
                  <Zap size={16} />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 leading-tight">
                  Speed up product pages
                </h4>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  Lifts the weakest website score
                </p>
              </div>

              {/* Win 2 */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-900">
                  <Video size={16} />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 leading-tight">
                  Post more video
                </h4>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  Video is 18% of mix; closes the engagement gap
                </p>
              </div>

              {/* Win 3 */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-900">
                  <Search size={16} />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 leading-tight">
                  Target gifting search terms
                </h4>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  Raises SEO ahead of festive peaks
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Right: Suggested First Campaign (5 cols - Dark Navy Card) */}
        <div className="lg:col-span-5 bg-[#1b253b] text-white rounded-2xl p-6 sm:p-7 shadow-md flex flex-col justify-between space-y-6">
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Suggested First Campaign
            </span>

            <div className="space-y-4 mt-5 text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-700/60">
                <span className="text-neutral-400 font-medium text-xs">Audience</span>
                <span className="font-bold text-white">Milestone gifters</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-700/60">
                <span className="text-neutral-400 font-medium text-xs">Channels</span>
                <span className="font-bold text-white">Instagram, Search</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-neutral-400 font-medium text-xs">Target CAC</span>
                <button
                  onClick={() => setCacModalOpen(true)}
                  className="px-3.5 py-1.5 border border-dashed border-neutral-400 hover:border-white text-neutral-200 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {targetCac ? targetCac : 'Set with client'}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setCacModalOpen(true)}
              className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 active:scale-98 text-white rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={14} className="text-blue-300" />
              <span>Configure Launch Parameters</span>
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================
          7. FOOTER DISCLAIMER
         ======================================================== */}
      <div className="text-[11px] text-neutral-400 leading-relaxed px-2 pt-2 text-center sm:text-left">
        Sample data for design review. Scores, shares and segments are illustrative. Real profiles are built from the client's website and social handles, shared with their permission, and from public competitor pages. Customer segments and share of voice are estimates until confirmed with client data.
      </div>

      {/* TARGET CAC MODAL */}
      {cacModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setCacModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-neutral-900">Set Target CAC</h4>
              <span className="text-xs text-neutral-400">Milestone gifters</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-neutral-600 block">Target Customer Acquisition Cost (₹)</label>
              <input
                type="text"
                value={targetCac}
                onChange={e => setTargetCac(e.target.value)}
                placeholder="e.g. ₹4,500"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#2563eb] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCacModalOpen(false)}
                className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Save CAC Target
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
