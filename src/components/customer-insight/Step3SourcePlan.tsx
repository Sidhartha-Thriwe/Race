import React from 'react';
import { CustomerInsightRunData } from './types';
import { Star } from 'lucide-react';

interface Step3SourcePlanProps {
  data: CustomerInsightRunData;
  onBack: () => void;
  onNext: () => void;
  busy?: boolean;
}

export const Step3SourcePlan: React.FC<Step3SourcePlanProps> = ({
  data,
  onBack,
  onNext,
  busy = false,
}) => {
  const { sourcePlan } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-semibold mb-1">
            STEP 3 OF 6
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Source plan
          </h2>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Which public profiles can be read, and which cannot.
          </p>
        </div>
        <div className="self-start sm:self-center px-3 py-1.5 bg-neutral-100 border border-neutral-200/80 rounded-full text-xs font-semibold text-neutral-600 flex items-center gap-1.5">
          <span>Plan only · nothing called, nothing spent</span>
        </div>
      </div>

      {/* Top Summary Card */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Identifiers Found */}
          <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-neutral-100 pb-4 md:pb-0 md:pr-6">
            <div className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
              {sourcePlan.identifiersFound}
            </div>
            <div className="text-xs font-medium text-neutral-500 mt-1">
              identifiers found
            </div>
          </div>

          {/* Modules Routed Progress Bar */}
          <div className="md:col-span-9 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-800">
                {sourcePlan.modulesRouted} modules routed
              </span>
              <div className="flex items-center gap-4 text-xs text-neutral-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1e293b]" />
                  <span>{sourcePlan.readyCount} Ready</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
                  <span>{sourcePlan.blockedCount} Blocked</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1]" />
                  <span>{sourcePlan.noRouteCount} No route</span>
                </span>
              </div>
            </div>

            {/* Stacked Progress Bar */}
            <div className="h-3.5 bg-neutral-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(sourcePlan.readyCount / sourcePlan.modulesRouted) * 100}%` }}
                className="bg-[#1e293b]"
              />
              <div
                style={{ width: `${(sourcePlan.blockedCount / sourcePlan.modulesRouted) * 100}%` }}
                className="bg-[#d97706]"
              />
              <div
                style={{ width: `${(sourcePlan.noRouteCount / sourcePlan.modulesRouted) * 100}%` }}
                className="bg-[#cbd5e1]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Ready to fetch */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-800 px-1">
            <span>Ready to fetch</span>
            <span className="text-neutral-500 font-medium">
              {sourcePlan.readyCount} sources
            </span>
          </div>

          <div className="space-y-3">
            {sourcePlan.sources.map((src) => (
              <div
                key={src.id}
                className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center font-bold text-xs text-neutral-800 border border-neutral-200/60 font-mono">
                      {src.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-neutral-900">
                        {src.platform}
                      </div>
                      <div className="text-xs font-mono text-neutral-500">
                        {src.reader}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full capitalize ${
                      src.status === 'verified'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : src.status === 'contested'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {src.status}
                  </span>
                </div>

                {/* Built From Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-neutral-500 text-[11px]">Built from</span>
                  {src.builtFrom.map((field, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-neutral-100 border border-neutral-200/70 rounded-md text-[11px] text-neutral-700 font-medium"
                    >
                      {field}
                    </span>
                  ))}
                </div>

                {/* Extra Flags & Inputs */}
                {(src.flag || src.hasViewInput) && (
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                    {src.flag && (
                      <span className="flex items-center gap-1 text-amber-700 font-medium text-[11px]">
                        <Star size={12} className="text-amber-500 fill-amber-500" />
                        <span>{src.flag}</span>
                      </span>
                    )}
                    {src.hasViewInput && (
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 ml-auto cursor-pointer"
                      >
                        View input
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Why blocked & No route */}
        <div className="lg:col-span-5 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-900">
              Why {sourcePlan.blockedCount} are blocked
            </h3>

            <div className="space-y-3">
              {sourcePlan.blockedReasons.map((reason, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-neutral-700">
                    <span>{reason.label}</span>
                    <span className="font-mono tabular-nums text-neutral-900 font-bold">
                      {reason.count}
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(reason.count / 6) * 100}%` }}
                      className="h-full bg-[#d97706] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-5 border-t border-neutral-100 space-y-2">
            <div className="text-xs font-bold text-neutral-900">
              {sourcePlan.noRouteCount} with no route
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed font-medium">
              Registered accounts with no readable public profile.
            </p>
            <div className="pt-2">
              <button
                type="button"
                className="text-xs font-semibold text-[#1e293b] hover:underline cursor-pointer"
              >
                View all {sourcePlan.modulesRouted} modules
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="pt-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            Back
          </button>
          <span className="text-xs font-semibold text-neutral-500">
            Estimated $0.05
          </span>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={busy}
          className="px-6 py-2.5 text-xs font-semibold text-white bg-[#1e293b] hover:bg-[#0f172a] rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Fetch {sourcePlan.readyCount} profiles
        </button>
      </div>
    </div>
  );
};
