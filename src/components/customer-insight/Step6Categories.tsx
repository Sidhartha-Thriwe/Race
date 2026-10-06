import React, { useState } from 'react';
import { CustomerInsightRunData } from './types';
import { Download, EyeOff, CheckCircle2, Check } from 'lucide-react';

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
            Preferred Areas
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

      {/* Why this ranking — scored → preferred / less preferred */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-neutral-800 px-1">Why this ranking</h3>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Funnel */}
          <div className="md:col-span-5 space-y-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">{categories.scoredCount}</span>
              <span className="text-xs font-medium text-neutral-500">areas scored</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden flex bg-neutral-100">
              <div style={{ width: `${(categories.rankedCount / Math.max(1, categories.scoredCount)) * 100}%` }} className="bg-[#1e293b]" />
              <div style={{ width: `${(categories.setAsideCount / Math.max(1, categories.scoredCount)) * 100}%` }} className="bg-neutral-300" />
            </div>
            <div className="flex items-center gap-4 text-[11px] font-medium text-neutral-600">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1e293b]" />{categories.rankedCount} preferred</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neutral-300" />{categories.setAsideCount} less preferred</span>
            </div>
          </div>

          {/* Why areas were set aside */}
          <div className="md:col-span-5 space-y-2 md:border-l md:border-neutral-100 md:pl-6">
            <div className="text-[11px] font-semibold text-neutral-500">Why others ranked lower</div>
            {(categories.ruleCounts ?? []).length === 0 ? (
              <div className="text-xs text-neutral-400">None set aside</div>
            ) : (categories.ruleCounts ?? []).map((r) => (
              <div key={r.label} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
                <span className="text-[11.5px] text-neutral-700 font-medium truncate">{r.label}</span>
                <span className="font-mono text-[11px] font-bold text-neutral-900 tabular-nums">{r.count}</span>
                <div className="col-span-2 h-1 bg-neutral-100 rounded-full overflow-hidden">
                  <div style={{ width: `${(r.count / Math.max(1, categories.setAsideCount)) * 100}%` }} className="h-full bg-neutral-400 rounded-full" />
                </div>
              </div>
            ))}
          </div>

          {/* Dormant paid affinity */}
          <div className="md:col-span-2 md:border-l md:border-neutral-100 md:pl-6 space-y-1.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${categories.dormantFound ? 'bg-amber-50 text-amber-700' : 'bg-neutral-100 text-neutral-500'}`}>
              {categories.dormantFound ? <EyeOff size={16} /> : <Check size={16} />}
            </div>
            <div className="text-[11px] font-semibold text-neutral-500 leading-tight">Dormant paid affinity</div>
            <div className={`text-sm font-bold ${categories.dormantFound ? 'text-amber-700' : 'text-neutral-900'}`}>
              {categories.dormantFound ? 'Found' : 'None'}
            </div>
          </div>
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
              {categories.scoredCount} scored · {categories.rankedCount} preferred · {categories.setAsideCount} less preferred
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
                  <ul className="space-y-1.5 max-w-xl pt-0.5">
                    {(item.bullets && item.bullets.length ? item.bullets : [{ text: item.description }]).map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2 text-xs leading-relaxed">
                        <span className={`mt-[7px] w-1 h-1 rounded-full shrink-0 ${b.caveat ? 'bg-amber-500' : 'bg-neutral-400'}`} />
                        <span className={b.caveat ? 'text-amber-800 font-medium' : 'text-neutral-600 font-medium'}>
                          {b.caveat && <span className="font-bold">Watch-out: </span>}
                          {b.text}
                        </span>
                      </li>
                    ))}
                  </ul>

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

        {/* Less preferred areas (collapsible) */}
        {showSetAside && (
          <div className="pt-4 border-t border-neutral-100 space-y-3">
            <h4 className="text-xs font-bold text-neutral-800">Less preferred areas</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {categories.setAside.map((sa, idx) => (
                <div key={idx} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-neutral-800 leading-snug">{sa.title}</span>
                    {sa.rule && (
                      <span className="shrink-0 px-2 py-0.5 bg-white border border-neutral-200 rounded-md text-[10.5px] text-neutral-600 font-medium">
                        {sa.rule}
                      </span>
                    )}
                  </div>
                  {sa.reason && <div className="text-[11px] text-neutral-500 leading-relaxed">{sa.reason}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-neutral-100 text-xs text-neutral-500">
          <button
            type="button"
            onClick={() => setShowSetAside(!showSetAside)}
            className="font-semibold text-[#1e293b] hover:underline cursor-pointer"
          >
            {showSetAside ? 'Hide less preferred areas' : `Show less preferred areas (${categories.setAsideCount})`}
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
