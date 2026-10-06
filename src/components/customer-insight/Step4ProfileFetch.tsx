import React from 'react';
import { CustomerInsightRunData } from './types';
import { Download, RefreshCw } from 'lucide-react';

interface Step4ProfileFetchProps {
  data: CustomerInsightRunData;
  onBack: () => void;
  onNext: () => void;
  busy?: boolean;
}

export const Step4ProfileFetch: React.FC<Step4ProfileFetchProps> = ({
  data,
  onBack,
  onNext,
  busy = false,
}) => {
  const { profileFetch } = data;

  const handleDownloadJson = () => {
    const payload = JSON.stringify(profileFetch, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `race_profile_fetch_${data.subjectId.replace(/\s+/g, '_')}.json`);
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
            STEP 4 OF 6
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Enriched Data
          </h2>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            What each public profile actually returned.
          </p>
        </div>
        <div className="self-start sm:self-center text-xs font-mono font-bold text-neutral-600">
          {profileFetch.duration} · ${profileFetch.totalSpendUSD.toFixed(2)}
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-3xl font-bold tracking-tight text-emerald-600 tabular-nums">
            {profileFetch.usable}
          </div>
          <div className="text-xs font-medium text-neutral-500 mt-1">
            Usable
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-3xl font-bold tracking-tight text-amber-600 tabular-nums">
            {profileFetch.stubOnly}
          </div>
          <div className="text-xs font-medium text-neutral-500 mt-1">
            Stub only
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-3xl font-bold tracking-tight text-red-600 tabular-nums">
            {profileFetch.failed}
          </div>
          <div className="text-xs font-medium text-neutral-500 mt-1">
            Failed
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
              {profileFetch.fieldsFilled}
            </span>
            <span className="text-xs font-medium text-neutral-500">
              of {profileFetch.totalFields} fields
            </span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              style={{ width: `${(profileFetch.totalFields ? (profileFetch.fieldsFilled / profileFetch.totalFields) * 100 : 0)}%` }}
              className="h-full bg-[#1e293b] rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profileFetch.profiles.map((prof, idx) => (
          <div
            key={idx}
            className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      prof.status === 'good'
                        ? 'bg-emerald-50 text-emerald-700'
                        : prof.status === 'stub'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {prof.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-neutral-900">
                      {prof.platform}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-400">
                      {prof.duration} · ${prof.costUSD.toFixed(2)}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-full capitalize ${
                    prof.status === 'good'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : prof.status === 'stub'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      : 'bg-red-50 text-red-700 border border-red-200/60'
                  }`}
                >
                  {prof.status === 'good' ? 'Good' : prof.status === 'stub' ? 'Stub only' : 'Failed'}
                </span>
              </div>

              {/* Progress */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-neutral-600 font-medium">
                  <span>Fields filled</span>
                  <span className="font-mono tabular-nums font-bold text-neutral-900">
                    {prof.fieldsFilled} / {prof.totalFields}
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(prof.totalFields ? (prof.fieldsFilled / prof.totalFields) * 100 : 0)}%` }}
                    className={`h-full rounded-full ${
                      prof.status === 'good'
                        ? 'bg-[#1e293b]'
                        : prof.status === 'stub'
                        ? 'bg-[#d97706]'
                        : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
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
            onClick={onNext}
            disabled={busy}
            className="px-6 py-2.5 text-xs font-semibold text-white bg-[#1e293b] hover:bg-[#0f172a] rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Build persona
          </button>
        </div>
      </div>
    </div>
  );
};
