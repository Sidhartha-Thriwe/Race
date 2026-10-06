import React, { useEffect, useState } from 'react';
import {
  Globe,
  Share2,
  Search,
  Target,
  Users,
  ArrowRight,
  Check
} from 'lucide-react';
import { OnboardedClient } from './ClientOnboarding';
import { GeneratingOrb } from './GeneratingOrb';

interface GeneratingReportScreenProps {
  client?: OnboardedClient | null;
  onComplete: () => void;
}

export const GeneratingReportScreen: React.FC<GeneratingReportScreenProps> = ({
  client,
  onComplete,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [activeStage, setActiveStage] = useState<number>(0);

  const clientName = client?.clientName?.trim() || 'Aurelia Watches';

  const stages = [
    { label: 'Auditing Domain & Tech Stack', icon: Globe },
    { label: 'Scanning Social Footprints', icon: Share2 },
    { label: 'Indexing SEO & Visibility', icon: Search },
    { label: 'Benchmarking 3 Competitors', icon: Target },
    { label: 'Synthesizing Buyer Personas', icon: Users },
  ];

  const orbMessages = [
    `Auditing domain architecture for ${clientName}...`,
    'Scanning public social footprints and executive profiles...',
    'Indexing SEO visibility and competitive search rankings...',
    'Benchmarking top 3 competitors and target CAC metrics...',
    'Synthesizing ICP behavioral buyer personas...'
  ];

  useEffect(() => {
    const startTime = Date.now();
    const duration = 5200; // 5.2s duration

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 20) setActiveStage(0);
      else if (pct < 45) setActiveStage(1);
      else if (pct < 70) setActiveStage(2);
      else if (pct < 90) setActiveStage(3);
      else setActiveStage(4);

      if (elapsed >= duration) {
        clearInterval(interval);
        setTimeout(onComplete, 300);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 font-sans text-center">
      <div className="bg-white border border-neutral-200/90 rounded-3xl p-8 sm:p-12 shadow-sm relative overflow-hidden space-y-8">
        
        {/* Subtle Ambient Background Ring */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-50/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-50/60 rounded-full blur-3xl pointer-events-none" />

        {/* Centerpiece Generating Orb with 4s rotating text */}
        <GeneratingOrb
          messages={orbMessages}
          subtitle={`Running real-time enrichment and market benchmarking for ${clientName}`}
          intervalMs={4000}
          size={240}
        />

        {/* Graphical Stage Icons Dock */}
        <div className="grid grid-cols-5 gap-2 pt-2 border-t border-neutral-100">
          {stages.map((st, idx) => {
            const Icon = st.icon;
            const isCompleted = idx < activeStage || progress === 100;
            const isCurrent = idx === activeStage && progress < 100;

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-700'
                    : isCurrent
                    ? 'bg-blue-50 border-[#2563eb] text-[#2563eb] scale-105 shadow-2xs'
                    : 'bg-neutral-50/50 border-neutral-200/50 text-neutral-400 opacity-60'
                }`}
              >
                <div className="relative">
                  <Icon size={18} />
                  {isCompleted && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                      <Check size={8} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-center leading-tight truncate w-full hidden sm:block">
                  {st.label.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress Shimmer Bar */}
        <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-[#1b253b] rounded-full transition-all duration-100 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/30 animate-[shimmer_1.5s_infinite] w-full" />
          </div>
        </div>

        {/* Skip to Report button */}
        <div className="pt-1">
          <button
            onClick={onComplete}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer group"
          >
            <span>Skip to report</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
};
