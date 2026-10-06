import React, { useState } from 'react';
import { CustomerInsightRunData } from './types';
import { Download, Briefcase, Ban, EyeOff, CheckCircle2 } from 'lucide-react';

interface Step6CategoriesProps {
  data: CustomerInsightRunData;
  onBack: () => void;
  onStartNewRun: () => void;
  busy?: boolean;
}

export const Step6Categories: React.FC<Step6CategoriesProps> = ({
  data,
  onBack,
  onStartNewRun,
}) => {
  const [showSetAside, setShowSetAside] = useState(false);
  const { categories } = data;

  const handleDownloadJson = () => {
    const payload = JSON.stringify(categories, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `race_categories_${data.subjectId.replace(/\s+/g, '_')}.json`);
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
            STEP 6 OF 6
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Categories
          </h2>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            What this subject is drawn to, ranked by evidence and fit.
          </p>
        </div>
        <div className="self-start sm:self-center px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-full text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
          <CheckCircle2 size={13} />
          <span>Run complete</span>
        </div>
      </div>

      {/* Why this ranking (3 Cards) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-neutral-800 px-1">
          Why this ranking
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.whyRanking.map((w, i) => (
            <div key={i} className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${w.icon === 'eye-off' ? 'bg-amber-50 text-amber-700' : 'bg-neutral-100 text-neutral-700'}`}>
                {w.icon === 'briefcase' ? <Briefcase size={16} /> : w.icon === 'slash' ? <Ban size={16} /> : <EyeOff size={16} />}
              </div>
              <div>
                <div className="text-sm font-bold text-neutral-900">{w.title}</div>
                <div className="text-xs text-neutral-500 font-medium mt-0.5">{w.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ranked Categories Card */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              Ranked categories
            </h3>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              {categories.scoredCount} scored · {categories.rankedCount} ranked · {categories.setAsideCount} set aside
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-neutral-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1e293b]" />
              <span>Evidence</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]" />
              <span>Psych fit</span>
            </span>
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-4 divide-y divide-neutral-100">
          {categories.ranked.map((item) => (
            <div
              key={item.rank}
              className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Details */}
              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-[#1e293b] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {item.rank}
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-neutral-900">
                    {item.title}
                  </h4>
                  <p className="text-xs text-neutral-600 font-medium leading-relaxed max-w-xl">
                    {item.description}
                  </p>

                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 bg-neutral-100 border border-neutral-200/70 rounded-md text-[11px] text-neutral-700 font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Bars */}
              <div className="md:w-60 shrink-0 space-y-2.5 bg-neutral-50/50 p-3 rounded-xl border border-neutral-100">
                {/* Evidence Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium">Evidence</span>
                    <span className="font-mono font-bold text-neutral-900 tabular-nums">
                      {item.evidence}
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-200/70 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(item.evidence / 10) * 100}%` }}
                      className="h-full bg-[#1e293b] rounded-full"
                    />
                  </div>
                </div>

                {/* Psych fit Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium">Psych fit</span>
                    <span className="font-mono font-bold text-neutral-900 tabular-nums">
                      {item.psychFit}
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-200/70 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(item.psychFit / 10) * 100}%` }}
                      className="h-full bg-[#64748b] rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Set Aside Section (Collapsible) */}
        {showSetAside && (
          <div className="pt-4 border-t border-neutral-100 space-y-3">
            <h4 className="text-xs font-bold text-neutral-800">
              {categories.setAsideCount} Set Aside Categories
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {categories.setAside.map((sa, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200/60 space-y-0.5"
                >
                  <div className="font-medium text-neutral-800">{sa.title}</div>
                  <div className="text-[11px] text-neutral-500 leading-relaxed">{sa.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-neutral-100 text-xs text-neutral-500">
          <span>
            Categories only. Offers are a separate step with their own rules.
          </span>
          <button
            type="button"
            onClick={() => setShowSetAside(!showSetAside)}
            className="font-semibold text-[#1e293b] hover:underline cursor-pointer self-start sm:self-auto"
          >
            {showSetAside ? 'Hide set aside' : `Show ${categories.setAsideCount} set aside`}
          </button>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={handleDownloadJson}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer"
        >
          <Download size={13} />
          <span>Download JSON</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onStartNewRun}
            className="px-6 py-2.5 text-xs font-semibold text-white bg-[#1e293b] hover:bg-[#0f172a] rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Start new run
          </button>
        </div>
      </div>
    </div>
  );
};
